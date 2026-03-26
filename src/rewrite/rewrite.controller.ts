import { Controller, Post, Get, Body, Req, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RewriteService } from './rewrite.service';
import { RewriteDto } from './dto/rewrite.dto';
import { UndoRewriteDto } from './dto/undo-rewrite.dto';
import { RewriteHistoryDto } from './dto/rewrite-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@ApiTags('Rewrite')
@ApiBearerAuth()
@Controller('rewrite')
@UseGuards(JwtAuthGuard)
export class RewriteController {
  constructor(private readonly rewriteService: RewriteService) {}

  @Post()
  @ApiOperation({ summary: 'Rewrite text using selected tone' })
  @ApiBody({
    type: RewriteDto,
    examples: {
      default: {
        summary: 'Rewrite Example',
        value: {
          text: 'Can you help me with this project?',
          tone: 'professional'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Text rewritten successfully.' })
  async rewrite(@Body() rewriteDto: RewriteDto, @Req() req) {
    return this.rewriteService.rewriteText(rewriteDto, req.user);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get rewrite history' })
  @ApiResponse({ status: 200, description: 'Rewrite history fetched.' })
  async getHistory(@Req() req, @Query() historyDto: RewriteHistoryDto) {
    return this.rewriteService.getHistory(req.user, historyDto);
  }

  @Post('undo')
  @ApiOperation({ summary: 'Undo recent rewrite' })
  @ApiBody({
    type: UndoRewriteDto,
    examples: {
      default: {
        summary: 'Undo Example',
        value: {
          rewriteId: 'clx123abc456def789'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Rewrite undone.' })
  async undoRewrite(@Body() undoDto: UndoRewriteDto, @Req() req) {
    return this.rewriteService.undoRewrite(undoDto, req.user);
  }
}
