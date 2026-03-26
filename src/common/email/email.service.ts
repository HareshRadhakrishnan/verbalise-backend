import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
       tls: {
    rejectUnauthorized: false, // <--- add this line
  },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@verbalise.ai',
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendVerificationCode(to: string, code: string) {
    const subject = 'Your Verbalise Verification Code';
    const html = `<p>Your verification code is: <b>${code}</b></p>`;
    await this.sendMail(to, subject, html);
  }

  async sendPasswordResetCode(to: string, code: string) {
    const subject = 'Your Verbalise Password Reset Code';
    const html = `<p>Your password reset code is: <b>${code}</b></p>`;
    await this.sendMail(to, subject, html);
  }
}
