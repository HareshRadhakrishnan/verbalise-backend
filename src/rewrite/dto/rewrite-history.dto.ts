import { IsOptional, IsNumber, Min } from 'class-validator';

export class RewriteHistoryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  offset?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
