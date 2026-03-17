import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../common/prisma.service';
import { getMonthlyLimit, isUnlimited } from '../common/plan-limits';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      success: !!user,
      data: user,
      message: user ? 'User profile fetched successfully' : 'User not found',
      error: user ? null : { code: 'USER_NOT_FOUND', details: {} },
      meta: { timestamp: new Date().toISOString(), requestId: '', pagination: null },
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
    });
    return {
      success: true,
      data: user,
      message: 'User profile updated successfully',
      error: null,
      meta: { timestamp: new Date().toISOString(), requestId: '', pagination: null },
    };
  }

  async getUsage(userId: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [usageHistory, subscription] = await Promise.all([
      this.prisma.usageRecord.findMany({
        where: { userId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      this.prisma.subscription.findUnique({ where: { userId } }),
    ]);

    const plan = subscription?.status === 'ACTIVE' ? subscription.plan : 'FREE';
    const limit = getMonthlyLimit(plan);
    const unlimited = isUnlimited(plan);

    const currentRecord = usageHistory.find(
      (r) => r.month === currentMonth && r.year === currentYear,
    );
    const usedThisMonth = currentRecord?.rewriteCount ?? 0;
    const tokensThisMonth = currentRecord?.tokensUsed ?? 0;

    return {
      success: true,
      data: {
        summary: {
          plan,
          currentMonth: { month: currentMonth, year: currentYear },
          rewritesUsed: usedThisMonth,
          rewritesLimit: unlimited ? null : limit,
          rewritesRemaining: unlimited ? null : Math.max(0, limit - usedThisMonth),
          tokensUsed: tokensThisMonth,
          unlimited,
          percentUsed: unlimited ? 0 : Math.min(100, Math.round((usedThisMonth / limit) * 100)),
        },
        history: usageHistory,
      },
      message: 'Usage statistics fetched successfully',
      error: null,
      meta: { timestamp: now.toISOString(), requestId: '', pagination: null },
    };
  }

  async getSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    return {
      success: !!subscription,
      data: subscription,
      message: subscription ? 'Subscription details fetched successfully' : 'Subscription not found',
      error: subscription ? null : { code: 'SUBSCRIPTION_NOT_FOUND', details: {} },
      meta: { timestamp: new Date().toISOString(), requestId: '', pagination: null },
    };
  }
}
