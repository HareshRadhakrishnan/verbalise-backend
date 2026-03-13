import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RewriteDto } from './dto/rewrite.dto';
import { UndoRewriteDto } from './dto/undo-rewrite.dto';
import { RewriteHistoryDto } from './dto/rewrite-history.dto';
import { OpenaiService } from '../openai/openai.service';
import { PrismaService } from '../common/prisma.service';
import { getMonthlyLimit, isUnlimited } from '../common/plan-limits';

@Injectable()
export class RewriteService {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly prisma: PrismaService,
  ) {}

  private currentMonthYear() {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }

  private async getOrCreateUsageRecord(userId: string) {
    const { month, year } = this.currentMonthYear();
    return this.prisma.usageRecord.upsert({
      where: { userId_month_year: { userId, month, year } },
      create: { userId, month, year, rewriteCount: 0, tokensUsed: 0 },
      update: {},
    });
  }

  private async getUserPlan(userId: string): Promise<string> {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    return sub?.status === 'ACTIVE' ? sub.plan : 'FREE';
  }

  async rewriteText(rewriteDto: RewriteDto, user: any) {
    if (!user?.id) throw new ForbiddenException('User not authenticated');
    const { text, tone } = rewriteDto;

    if (!text || text.length < 10 || text.length > 2000) {
      throw new BadRequestException('Text must be between 10 and 2000 characters');
    }

    // ── Subscription enforcement ───────────────────────────────────────────────
    const plan = await this.getUserPlan(user.id);
    const limit = getMonthlyLimit(plan);

    if (!isUnlimited(plan)) {
      const usage = await this.getOrCreateUsageRecord(user.id);
      if (usage.rewriteCount >= limit) {
        const upgradeMessage =
          plan === 'FREE'
            ? 'You have reached your 50 rewrite/month limit on the Free plan. Upgrade to Pro for 500 rewrites/month.'
            : `You have reached your ${limit} rewrite/month limit on the ${plan} plan. Upgrade to Business for unlimited rewrites.`;
        throw new ForbiddenException({
          message: upgradeMessage,
          code: 'USAGE_LIMIT_EXCEEDED',
          plan,
          limit,
          used: usage.rewriteCount,
        });
      }
    }

    // ── Resolve tone ───────────────────────────────────────────────────────────
    const toneObj = await this.prisma.tone.findFirst({
      where: { name: tone, OR: [{ userId: user.id }, { isDefault: true }] },
    });
    if (!toneObj) throw new NotFoundException('Tone not found');

    // ── Call OpenAI ────────────────────────────────────────────────────────────
    const aiResult = await this.openaiService.rewriteText(toneObj.prompt, text);

    // ── Persist history ────────────────────────────────────────────────────────
    const history = await this.prisma.rewriteHistory.create({
      data: {
        userId: user.id,
        toneId: toneObj.id,
        originalText: text,
        rewrittenText: aiResult.rewrittenText,
        tokensUsed: aiResult.tokensUsed,
        responseTime: aiResult.responseTime,
      },
    });

    // ── Update usage record ────────────────────────────────────────────────────
    const { month, year } = this.currentMonthYear();
    const updatedUsage = await this.prisma.usageRecord.upsert({
      where: { userId_month_year: { userId: user.id, month, year } },
      create: { userId: user.id, month, year, rewriteCount: 1, tokensUsed: aiResult.tokensUsed },
      update: {
        rewriteCount: { increment: 1 },
        tokensUsed: { increment: aiResult.tokensUsed },
      },
    });

    const remaining = isUnlimited(plan) ? null : limit - updatedUsage.rewriteCount;

    return {
      success: true,
      data: {
        rewrittenText: aiResult.rewrittenText,
        tokensUsed: aiResult.tokensUsed,
        historyId: history.id,
        usage: {
          plan,
          rewritesUsed: updatedUsage.rewriteCount,
          rewritesLimit: isUnlimited(plan) ? null : limit,
          rewritesRemaining: remaining,
        },
      },
      message: 'Rewrite processed',
      error: null,
      meta: { responseTime: aiResult.responseTime },
    };
  }

  async getHistory(user: any, historyDto: RewriteHistoryDto) {
    if (!user?.id) throw new ForbiddenException('User not authenticated');
    const offset = historyDto.offset || 0;
    const limit = historyDto.limit || 10;
    const [items, total] = await Promise.all([
      this.prisma.rewriteHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: { tone: true },
      }),
      this.prisma.rewriteHistory.count({ where: { userId: user.id } }),
    ]);
    return {
      success: true,
      data: items,
      message: 'History fetched',
      error: null,
      meta: { pagination: { offset, limit, total } },
    };
  }

  async undoRewrite(undoDto: UndoRewriteDto, user: any) {
    if (!user?.id) throw new ForbiddenException('User not authenticated');
    const history = await this.prisma.rewriteHistory.findUnique({ where: { id: undoDto.rewriteId } });
    if (!history || history.userId !== user.id) throw new NotFoundException('Rewrite history not found');

    // Decrement usage count when a rewrite is undone
    const { month, year } = this.currentMonthYear();
    await this.prisma.usageRecord.updateMany({
      where: { userId: user.id, month, year },
      data: {
        rewriteCount: { decrement: 1 },
        tokensUsed: { decrement: history.tokensUsed },
      },
    });

    await this.prisma.rewriteHistory.delete({ where: { id: undoDto.rewriteId } });

    return {
      success: true,
      data: null,
      message: 'Rewrite undone',
      error: null,
      meta: {},
    };
  }
}
