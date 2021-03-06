import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import User from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import { UsersRepository } from '../users/users.repository';

const mockUsersRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
});

const mockMailService = () => ({
  sendUserConfirmation: jest.fn(),
});

describe('AuthService', () => {
  let authService: AuthService;
  let mailService;
  let usersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get('JWT_SECRET'),
            signOptions: {
              expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}s`,
            },
          }),
        }),
      ],
      providers: [
        AuthService,
        { provide: UsersRepository, useFactory: mockUsersRepository },
        { provide: MailService, useFactory: mockMailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    mailService = module.get(MailService);
  });

  describe('login', () => {
    const loginDto = new LoginDto();
    loginDto.email = 'Test@email.com';
    loginDto.password = 'Password123';

    it('throw UnauthorizedException (401), email not found / wrong email', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      expect(authService.login(loginDto)).rejects.toThrowError(
        UnauthorizedException,
      );
    });

    it('throw UnauthorizedException (401), password doesnt match', async () => {
      const user = new User();
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash('wrongPassword', salt);
      user.password = hashedPassword;

      usersRepository.findOne.mockResolvedValue(user);

      expect(authService.login(loginDto)).rejects.toThrowError(
        UnauthorizedException,
      );
    });

    it('authorize user and return payload with user and token', async () => {
      const user = new User();
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(loginDto.password, salt);
      user.password = hashedPassword;

      usersRepository.findOne.mockResolvedValue(user);

      const response = await authService.login(loginDto);

      expect(response).toEqual({
        user: user,
        accessToken: expect.any(String),
      });
    });
  });

  describe('accountConfirmation', () => {
    it('throw UnauthorizedException (401), provided verification token expired', () => {
      usersRepository.findOne.mockResolvedValue(null);

      expect(authService.accountConfirmation('token')).rejects.toThrowError(
        UnauthorizedException,
      );
    });

    it('successfully confirm user, set user to enable', async () => {
      const user = new User();
      user.confirmationToken = 'SomeLongToken';
      user.enabled = false;

      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.save.mockImplementationOnce((toSave) => {
        user.confirmationToken = toSave.confirmationToken;
        user.enabled = toSave.enabled;
      });

      const response = await authService.accountConfirmation('token');

      expect(user.enabled).toEqual(true);
      expect(user.confirmationToken).toEqual(null);
      expect(response).toEqual({
        message: expect.any(String),
      });
    });
  });

  describe('signup', () => {
    const signupDto = new SignupDto();
    signupDto.email = 'Test@email.com';
    signupDto.username = 'Tester';
    signupDto.password = 'Test123';

    const user = new User();
    user.email = signupDto.email;

    it('throw ConflictException (409), email has to be unique', async () => {
      usersRepository.create.mockResolvedValue(user);
      usersRepository.save.mockRejectedValue({ code: 23505, detail: 'email' });

      await expect(authService.singup(signupDto)).rejects.toThrowError(
        ConflictException,
      );
    });

    it('throw ConflictException (409), username has to be unique', async () => {
      usersRepository.create.mockResolvedValue(user);
      usersRepository.save.mockRejectedValue({
        code: 23505,
        detail: 'username',
      });

      await expect(authService.singup(signupDto)).rejects.toThrowError(
        ConflictException,
      );
    });

    it('throw UnternalServerErrorException (500), couldnt send email', async () => {
      usersRepository.create.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue(user);
      mailService.sendUserConfirmation.mockResolvedValue(false);

      await expect(authService.singup(signupDto)).rejects.toThrowError(
        InternalServerErrorException,
      );
    });

    it('throw UnternalServerErrorException (500), mailService throw error', async () => {
      usersRepository.create.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue(user);
      mailService.sendUserConfirmation.mockImplementation(() => {
        throw new Error();
      });

      await expect(authService.singup(signupDto)).rejects.toThrowError(
        InternalServerErrorException,
      );
    });

    it('create user with token and hased password, return user email, message and expire date', async () => {
      const basicPassword = signupDto.password;
      let hashedPassword: string;
      let confirmationToken: string;

      usersRepository.create.mockImplementationOnce((dto: SignupDto) => {
        user.password = dto.password;
        return user;
      });
      usersRepository.save.mockImplementation((saved: User) => {
        hashedPassword = saved.password;
        confirmationToken = saved.confirmationToken;
        return Promise.resolve(saved);
      });
      mailService.sendUserConfirmation.mockResolvedValue(true);

      const response = await authService.singup(signupDto);

      expect(await bcrypt.compare(basicPassword, hashedPassword)).toEqual(true);
      expect(confirmationToken).toEqual(expect.any(String));
      expect(response).toEqual({
        email: user.email,
        message: expect.any(String),
        expireDate: moment().day(1).format('YYYY/MM/DD'),
      });
    });
  });
});
