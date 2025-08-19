import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../common/prisma.service';

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
    const usage = await this.prisma.usageRecord.findMany({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return {
      success: true,
      data: usage,
      message: 'Usage statistics fetched successfully',
      error: null,
      meta: { timestamp: new Date().toISOString(), requestId: '', pagination: null },
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
