import { Module } from '@nestjs/common';
import { TonesController } from './tones.controller';
import { TonesService } from './tones.service';

@Module({
  controllers: [TonesController],
  providers: [TonesService],
  exports: [TonesService],
})
export class TonesModule {}
