import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SignupResponseDto } from './dto/signup-response.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  singup(@Body() signupDto: SignupDto): Promise<SignupResponseDto> {
    return this.authService.singup(signupDto);
  }
}
