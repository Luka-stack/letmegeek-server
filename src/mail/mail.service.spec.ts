import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';

import User from '../users/entities/user.entity';
import { MailService } from './mail.service';

describe('MailService', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
        MailerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            transport: {
              host: configService.get('MAIL_HOST'),
              secure: false,
              port: 2525,
              auth: {
                user: configService.get('MAIL_USER'),
                pass: configService.get('MAIL_PASSWORD'),
              },
            },
            defaults: {
              from: 'Let Me Geek <letmegeek@lmg.com>',
            },
            template: {
              dir: join(__dirname, 'templates'),
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true,
              },
            },
          }),
        }),
      ],
      providers: [MailService],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  describe('sendUserConfirmation', () => {
    it('send email to user', async () => {
      const user = new User();
      user.email = 'Test@test.com';
      user.username = 'Test';

      const response = await mailService.sendUserConfirmation(user, 'Token');

      expect(response).toEqual(true);
    });
  });
});
