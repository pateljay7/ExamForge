import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './auth.dto';
import { JwtAuthGuard } from './jwt.guard';
import { UserId } from './user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@UserId() userId: string) {
    return this.auth.me(userId);
  }
}
