import { IsString, IsNotEmpty } from 'class-validator';

export class UndoRewriteDto {
  @IsString()
  @IsNotEmpty()
  rewriteId: string;
}
