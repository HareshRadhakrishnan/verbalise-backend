import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsUrl } from 'class-validator';

export class GithubLoginDto {
  @ApiProperty({ description: 'GitHub user ID' })
  @IsString()
  githubId: string;

  @ApiProperty({ description: 'GitHub user email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'GitHub user display name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'GitHub user avatar URL' })
  @IsOptional()
  @IsString()
  image?: string;
}
