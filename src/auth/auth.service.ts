import { PrismaClient, User } from '@prisma/client';
import { addMinutes, isBefore } from 'date-fns';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { EmailService } from '../common/email/email.service';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const ACCESS_TOKEN_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

@Injectable()
export class AuthService {
  private jwt = new JwtService({ secret: JWT_SECRET });

  constructor(
    private readonly emailService: EmailService,
  ) {}

  async register(email: string, password: string, name?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });
    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Store code in DB (expires in 15 min)
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        code,
        expiresAt: addMinutes(new Date(), 15),
      },
    });
    await this.emailService.sendVerificationCode(email, code);
    return user;
  }
  async verifyEmail(email: string, code: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ConflictException('User not found');
    const record = await prisma.emailVerification.findFirst({
      where: { userId: user.id, code },
      orderBy: { createdAt: 'desc' },
    });
    if (!record || isBefore(record.expiresAt, new Date())) {
      throw new ConflictException('Invalid or expired code');
    }
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
    await prisma.emailVerification.deleteMany({ where: { userId: user.id } });
    return true;
  }

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ConflictException('User not found');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.passwordResetCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: addMinutes(new Date(), 15),
      },
    });
    await this.emailService.sendPasswordResetCode(email, code);
    return true;
  }

  async verifyPasswordReset(email: string, code: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ConflictException('User not found');
    const record = await prisma.passwordResetCode.findFirst({
      where: { userId: user.id, code },
      orderBy: { createdAt: 'desc' },
    });
    if (!record || isBefore(record.expiresAt, new Date())) {
      throw new ConflictException('Invalid or expired code');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await prisma.passwordResetCode.deleteMany({ where: { userId: user.id } });
    return true;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    const refreshToken = await this.jwt.signAsync(payload, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
    // Optionally: store refreshToken in DB for invalidation
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, { secret: JWT_SECRET });
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');
      return this.login(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    // For demo: stateless JWT, so nothing to do. For production, store and invalidate refresh tokens.
    return true;
  }

  async getProfile(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, image: true } });
  }

  async verifyAccessToken(token: string): Promise<any> {
    try {
      return await this.jwt.verifyAsync(token, { secret: JWT_SECRET });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
