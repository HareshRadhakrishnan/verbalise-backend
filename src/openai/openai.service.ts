import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    this.openai = new OpenAI({ apiKey });
  }

  async rewriteText(prompt: string, originalText: string): Promise<{ rewrittenText: string; tokensUsed: number; responseTime: number }> {
    const start = Date.now();
    const completionPrompt = `${prompt}\n\n${originalText}`;
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that rewrites text.' },
        { role: 'user', content: completionPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });
    const rewrittenText = response.choices[0].message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;
    const responseTime = Date.now() - start;
    return { rewrittenText, tokensUsed, responseTime };
  }
}
