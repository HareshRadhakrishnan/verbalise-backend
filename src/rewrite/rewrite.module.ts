
import { Module } from '@nestjs/common';
import { RewriteController } from './rewrite.controller';
import { RewriteService } from './rewrite.service';
import { OpenaiModule } from '../openai/openai.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [OpenaiModule, CommonModule],
  controllers: [RewriteController],
  providers: [RewriteService],
})
export class RewriteModule {}
