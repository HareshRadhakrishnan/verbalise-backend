import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;
}

export class PasswordResetVerifyDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: '123456' })
  code: string;

  @ApiProperty({ example: 'newPassword123' })
  newPassword: string;
}
