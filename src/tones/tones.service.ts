import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateToneDto } from './dto/create-tone.dto';
import { UpdateToneDto } from './dto/update-tone.dto';

// In production, inject PrismaService instead of new PrismaClient
const prisma = new PrismaClient();

const DEFAULT_TONES = [
  { name: 'Professional', prompt: 'Rewrite this text in a professional, business-appropriate tone' },
  { name: 'Casual', prompt: 'Rewrite this text in a casual, friendly conversational tone' },
  { name: 'Formal', prompt: 'Rewrite this text in a formal, academic tone' },
  { name: 'Persuasive', prompt: 'Rewrite this text to be more persuasive and compelling' },
  { name: 'Concise', prompt: 'Rewrite this text to be more concise while maintaining meaning' },
  { name: 'Friendly', prompt: 'Rewrite this text in a warm, friendly tone' },
  { name: 'Creative', prompt: 'Rewrite this text in a creative, engaging manner' },
];

@Injectable()
export class TonesService {
  async getUserTones(userId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    return prisma.tone.findMany({ where: { userId } });
  }

  async getDefaultTones() {
    return DEFAULT_TONES.map(t => ({ ...t, isDefault: true }));
  }

  async createTone(userId: string, dto: CreateToneDto) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    if (dto.prompt.length > 500) throw new ConflictException('Prompt too long');
    const exists = await prisma.tone.findUnique({ where: { name_userId: { name: dto.name, userId } } });
    if (exists) throw new ConflictException('Tone name must be unique');
    return prisma.tone.create({ data: { ...dto, userId } });
  }

  async updateTone(userId: string, id: string, dto: UpdateToneDto) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    const tone = await prisma.tone.findUnique({ where: { id } });
    if (!tone) throw new NotFoundException('Tone not found');
    if (tone.userId !== userId) throw new ForbiddenException('Not your tone');
    if (dto.name && dto.name !== tone.name) {
      const exists = await prisma.tone.findUnique({ where: { name_userId: { name: dto.name, userId } } });
      if (exists) throw new ConflictException('Tone name must be unique');
    }
    if (dto.prompt && dto.prompt.length > 500) throw new ConflictException('Prompt too long');
    return prisma.tone.update({ where: { id }, data: dto });
  }

  async deleteTone(userId: string, id: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    const tone = await prisma.tone.findUnique({ where: { id } });
    if (!tone) throw new NotFoundException('Tone not found');
    if (tone.userId !== userId) throw new ForbiddenException('Not your tone');
    await prisma.tone.delete({ where: { id } });
    return true;
  }
}
