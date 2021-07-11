import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import * as bcrypt from 'bcrypt';
import * as randomToken from 'rand-token';

import User from 'src/users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './guards/jwt-payload';
import { UsersRepository } from '../users/users.repository';
import { SignupResponseDto } from './dto/signup-response.dto';
import { BasicResponseDto } from '../shared/dto/basic-response.dto';
import { MailService } from '../mail/mail.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersRepository)
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async singup(signupDto: SignupDto): Promise<SignupResponseDto> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(signupDto.password, salt);
    signupDto.password = hashedPassword;

    const user = this.usersRepository.create(signupDto);

    const confirmationToken = randomToken.generate(16);
    user.confirmationToken = confirmationToken;

    await this.usersRepository.save(user).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException(
          `${
            err.detail.includes('email') ? 'Email' : 'Username'
          } has to be unique`,
        );
      }
    });

    try {
      await this.mailService
        .sendUserConfirmation(user, confirmationToken)
        .then((result) => {
          if (!result) {
            this.usersRepository.delete(user);
            throw new InternalServerErrorException('Couldnt create an account');
          }
        });
    } catch (err) {
      this.usersRepository.delete(user);
      throw new InternalServerErrorException('Couldnt create an account');
    }

    return {
      email: user.email,
      message: 'User registered. Confirmation token has been sent',
      expireDate: moment().add(1, 'days').format('YYYY/MM/DD'),
    };
  }

  async login(signinDto: LoginDto): Promise<{
    user: User;
    accessToken: string;
    // refreshToken: string;
  }> {
    const { email, password } = signinDto;
    const user = await this.usersRepository.findOne({ email });

    if (!user.enabled) {
      throw new BadRequestException('Account is not confirmed');
    }

    if (!user.blocked) {
      throw new BadRequestException('Account is blocked');
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload: JwtPayload = {
        email: user.email,
      };
      const accessToken: string = await this.jwtService.signAsync(payload);

      return {
        user,
        accessToken: accessToken,
        // refreshToken: 'RefreshToken',
      };
    }

    throw new UnauthorizedException('Please check your login crdentials');
  }

  async accountConfirmation(tokenPayload: {
    token: string;
  }): Promise<BasicResponseDto> {
    const user = await this.usersRepository.getUserFromValidConfirmationToken(
      tokenPayload.token,
    );

    if (!user) {
      throw new UnauthorizedException('Provided token expired');
    }

    user.confirmationToken = null;
    user.enabled = true;
    await this.usersRepository.save(user);

    return { message: 'User successfully confirmed' };
  }

  @Cron('* * 24 * * *')
  cleanDBFromOldUnconfirmedUsers(): void {
    this.usersRepository.deleteNotConfirmedUsers();
  }
}
