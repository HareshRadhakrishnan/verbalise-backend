
import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RewriteDto } from './dto/rewrite.dto';
import { UndoRewriteDto } from './dto/undo-rewrite.dto';
import { RewriteHistoryDto } from './dto/rewrite-history.dto';
import { OpenaiService } from '../openai/openai.service';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class RewriteService {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly prisma: PrismaService,
  ) {}

  async rewriteText(rewriteDto: RewriteDto, user: any) {
    if (!user?.id) throw new ForbiddenException('User not authenticated');
    const { text, tone } = rewriteDto;
    if (!text || text.length < 10 || text.length > 2000) {
      throw new BadRequestException('Text must be between 10 and 2000 characters');
    }
    // Get tone prompt
    const toneObj = await this.prisma.tone.findFirst({ where: { name: tone, OR: [{ userId: user.id }, { isDefault: true }] } });
    if (!toneObj) throw new NotFoundException('Tone not found');
    // Call OpenAI
    const aiResult = await this.openaiService.rewriteText(toneObj.prompt, text);
    // Save to history
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
    return {
      success: true,
      data: {
        rewrittenText: aiResult.rewrittenText,
        tokensUsed: aiResult.tokensUsed,
        historyId: history.id,
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
      meta: {
        pagination: {
          offset,
          limit,
          total,
        },
      },
    };
  }

  async undoRewrite(undoDto: UndoRewriteDto, user: any) {
    if (!user?.id) throw new ForbiddenException('User not authenticated');
    const history = await this.prisma.rewriteHistory.findUnique({ where: { id: undoDto.rewriteId } });
    if (!history || history.userId !== user.id) throw new NotFoundException('Rewrite history not found');
    // Optionally, mark as undone or delete
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
