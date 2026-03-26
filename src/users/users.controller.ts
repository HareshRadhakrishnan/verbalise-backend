import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile fetched successfully.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'user_123',
          email: 'user@example.com',
          name: 'John Doe',
          image: 'https://example.com/avatar.png',
          emailVerified: '2025-07-24T12:00:00.000Z',
          createdAt: '2025-07-01T12:00:00.000Z',
          updatedAt: '2025-07-24T12:00:00.000Z'
        },
        message: 'User profile fetched successfully',
        error: null,
        meta: {
          timestamp: '2025-07-24T12:00:00.000Z',
          requestId: 'req_abc',
          pagination: null
        }
      }
    }
  })
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({
    type: UpdateProfileDto,
    examples: {
      default: {
        summary: 'Update user profile',
        value: {
          name: 'Jane Doe',
          email: 'user@example.com',
          image: 'https://example.com/avatar2.png'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'user_123',
          email: 'user@example.com',
          name: 'Jane Doe',
          image: 'https://example.com/avatar2.png',
          emailVerified: '2025-07-24T12:00:00.000Z',
          createdAt: '2025-07-01T12:00:00.000Z',
          updatedAt: '2025-07-24T12:05:00.000Z'
        },
        message: 'User profile updated successfully',
        error: null,
        meta: {
          timestamp: '2025-07-24T12:05:00.000Z',
          requestId: 'req_def',
          pagination: null
        }
      }
    }
  })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage statistics' })
  @ApiResponse({
    status: 200,
    description: 'Usage statistics fetched successfully.',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'usage_1',
            userId: 'user_123',
            month: 7,
            year: 2025,
            rewriteCount: 42,
            tokensUsed: 1234,
            createdAt: '2025-07-01T12:00:00.000Z',
            updatedAt: '2025-07-24T12:00:00.000Z'
          }
        ],
        message: 'Usage statistics fetched successfully',
        error: null,
        meta: {
          timestamp: '2025-07-24T12:00:00.000Z',
          requestId: 'req_ghi',
          pagination: null
        }
      }
    }
  })
  async getUsage(@Request() req) {
    return this.usersService.getUsage(req.user.id);
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiResponse({
    status: 200,
    description: 'Subscription details fetched successfully.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'sub_123',
          userId: 'user_123',
          plan: 'PRO',
          status: 'ACTIVE',
          currentPeriodStart: '2025-07-01T00:00:00.000Z',
          currentPeriodEnd: '2025-08-01T00:00:00.000Z',
          cancelAtPeriodEnd: false,
          createdAt: '2025-07-01T00:00:00.000Z',
          updatedAt: '2025-07-24T12:00:00.000Z'
        },
        message: 'Subscription details fetched successfully',
        error: null,
        meta: {
          timestamp: '2025-07-24T12:00:00.000Z',
          requestId: 'req_jkl',
          pagination: null
        }
      }
    }
  })
  async getSubscription(@Request() req) {
    return this.usersService.getSubscription(req.user.id);
  }
}
