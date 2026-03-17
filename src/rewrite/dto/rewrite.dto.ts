import { IsString, IsNotEmpty, Length } from 'class-validator';

export class RewriteDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 2000, { message: 'Text must be between 10 and 2000 characters' })
  text: string;

  @IsString()
  @IsNotEmpty()
  tone: string;
}
