import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateToneDto {
  @ApiProperty({ example: 'Friendly' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Rewrite this text in a friendly tone', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prompt: string;
}
