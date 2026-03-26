import { Body, Controller, Get, Post, UnauthorizedException, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { PasswordResetRequestDto, PasswordResetVerifyDto } from './dto/password-reset.dto';
import { GithubLoginDto } from './dto/github-login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with code' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  @ApiBody({ type: VerifyEmailDto })
  async verifyEmail(@Body() body: VerifyEmailDto) {
    await this.authService.verifyEmail(body.email, body.code);
    return { success: true, data: null, message: 'Email verified', error: null, meta: null };
  }

  @Post('password-reset/request')
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiResponse({ status: 200, description: 'Password reset code sent' })
  @ApiBody({ type: PasswordResetRequestDto })
  async requestPasswordReset(@Body() body: PasswordResetRequestDto) {
    await this.authService.requestPasswordReset(body.email);
    return { success: true, data: null, message: 'Password reset code sent', error: null, meta: null };
  }

  @Post('password-reset/verify')
  @ApiOperation({ summary: 'Verify password reset code and set new password' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiBody({ type: PasswordResetVerifyDto })
  async verifyPasswordReset(@Body() body: PasswordResetVerifyDto) {
    await this.authService.verifyPasswordReset(body.email, body.code, body.newPassword);
    return { success: true, data: null, message: 'Password reset successful', error: null, meta: null };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(body.email, body.password, body.name);
    return { success: true, data: { id: user.id, email: user.email, name: user.name }, message: 'Registration successful', error: null, meta: null };
  }

  @Post('github')
  @ApiOperation({ summary: 'Login or register via GitHub OAuth' })
  @ApiResponse({ status: 200, description: 'User authenticated via GitHub' })
  @ApiBody({ type: GithubLoginDto })
  async githubLogin(@Body() body: GithubLoginDto) {
    const user = await this.authService.githubLogin(body.githubId, body.email, body.name, body.image);
    const tokens = await this.authService.login(user);
    return { success: true, data: tokens, message: 'GitHub login successful', error: null, meta: null };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiBody({ type: LoginDto })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const tokens = await this.authService.login(user);
    return { success: true, data: tokens, message: 'Login successful', error: null, meta: null };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiBody({ type: RefreshDto })
  async refresh(@Body() body: RefreshDto) {
    const tokens = await this.authService.refresh(body.refreshToken);
    return { success: true, data: tokens, message: 'Token refreshed', error: null, meta: null };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  async logout(@Body() body: { refreshToken: string }) {
    await this.authService.logout(body.refreshToken);
    return { success: true, data: null, message: 'Logged out', error: null, meta: null };
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile fetched successfully' })
  async profile(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) throw new UnauthorizedException();
    const token = authHeader.replace('Bearer ', '');
    const payload = await this.authService.verifyAccessToken(token);
    const profile = await this.authService.getProfile(payload.sub);
    return { success: true, data: profile, message: 'Profile fetched', error: null, meta: null };
  }
}
