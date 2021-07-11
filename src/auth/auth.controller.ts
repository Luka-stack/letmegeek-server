import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

import User from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { SignupResponseDto } from './dto/signup-response.dto';
import { BasicResponseDto } from '../shared/dto/basic-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('/signup')
  singup(@Body() signupDto: SignupDto): Promise<SignupResponseDto> {
    return this.authService.singup(signupDto);
  }

  @Get('/accountConfirmation/')
  accountConfirmation(
    @Query() tokenPayload: { token: string },
  ): Promise<BasicResponseDto> {
    return this.authService.accountConfirmation(tokenPayload);
  }

  @Post('/login')
  async login(
    @Body() signinDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<User> {
    const { user, ...payload } = await this.authService.login(signinDto);

    res.cookie('Auth-Cookie', payload.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      expires: new Date(
        Date.now() + this.configService.get('JWT_EXPIRATION_TIME') * 1000,
      ),
      path: '/',
    });
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/logout')
  async logout(
    @Res({ passthrough: true }) res: Response,
  ): Promise<BasicResponseDto> {
    res.cookie(
      'Auth-Cookie',
      {},
      {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
      },
    );

    return { message: 'User logged out' };
  }

  @Get('/test')
  test(): void {
    this.authService.cleanDBFromOldUnconfirmedUsers();
    return null;
  }
}
