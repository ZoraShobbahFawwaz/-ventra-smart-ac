import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ================= LOGIN =================
  @Post('login')
  login(@Body() body: LoginDto) {
    const { email, password } = body;
    return this.authService.login(email, password);
  }

  // ================= LOGOUT =================
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@Req() req: Request & { user?: any }) {
    return this.authService.logout(req.user);
  }

  // ================= REGISTER =================
  @Post('register')
  register(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('role') role: string,
  ) {
    return this.authService.register(name, email, password, role);
  }

  // ================= REQUEST RESET =================
  @Post('request-reset')
  requestReset(@Body('email') email: string) {
    return this.authService.requestReset(email);
  }

  // ================= RESET PASSWORD =================
  @Post('reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }
}