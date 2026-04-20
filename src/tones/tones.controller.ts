import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { TonesService } from './tones.service';
import { CreateToneDto } from './dto/create-tone.dto';
import { UpdateToneDto } from './dto/update-tone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tones')
@Controller('tones')
export class TonesController {
  constructor(private readonly tonesService: TonesService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get user's tones" })
  @ApiResponse({ status: 200, description: 'List of user tones' })
  async getTones(@Req() req) {
    const userId = req.user?.id;
    const tones = await this.tonesService.getUserTones(userId);
    return this.formatResponse(true, tones, 'User tones fetched');
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create new tone' })
  @ApiResponse({ status: 201, description: 'Tone created' })
  @ApiBody({ type: CreateToneDto })
  async createTone(@Req() req, @Body() body: CreateToneDto) {
    const userId = req.user?.id;
    const tone = await this.tonesService.createTone(userId, body);
    return this.formatResponse(true, tone, 'Tone created');
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update tone' })
  @ApiResponse({ status: 200, description: 'Tone updated' })
  @ApiBody({ type: UpdateToneDto })
  async updateTone(@Req() req, @Param('id') id: string, @Body() body: UpdateToneDto) {
    const userId = req.user?.id;
    const tone = await this.tonesService.updateTone(userId, id, body);
    return this.formatResponse(true, tone, 'Tone updated');
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete tone' })
  @ApiResponse({ status: 200, description: 'Tone deleted' })
  async deleteTone(@Req() req, @Param('id') id: string) {
    const userId = req.user?.id;
    await this.tonesService.deleteTone(userId, id);
    return this.formatResponse(true, null, 'Tone deleted');
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default tones' })
  @ApiResponse({ status: 200, description: 'List of default tones' })
  async getDefaultTones() {
    const tones = await this.tonesService.getDefaultTones();
    return this.formatResponse(true, tones, 'Default tones fetched');
  }

  private formatResponse(success: boolean, data: any, message: string, error: any = null) {
    return {
      success,
      data,
      message,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '', // You can generate a real requestId with a middleware/interceptor
        pagination: null,
      },
    };
  }
}
