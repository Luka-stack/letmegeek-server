import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UsersRepository } from '../users/users.repository';
import { SignupResponseDto } from './dto/signup-response.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersRepository)
    private readonly usersRepository: UsersRepository,
  ) {}

  async singup(signupDto: SignupDto): Promise<SignupResponseDto> {
    const user = this.usersRepository.create({
      blocked: true,
      enabled: false,
      ...signupDto,
    });

    await this.usersRepository.save(user).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException(
          `${
            err.detail.includes('email') ? 'Email' : 'Username'
          } has to be unique`,
        );
      }
    });

    return { email: 'Example2@ex.jp', expireDate: new Date() };
  }
}
