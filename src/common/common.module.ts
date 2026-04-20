
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EmailModule } from './email/email.module';


@Module({
  imports: [EmailModule],
  providers: [PrismaService],
  exports: [PrismaService, EmailModule],
})
export class CommonModule {}
