import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import User from 'src/users/entities/user.entity';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendUserConfirmation(user: User, token: string): Promise<boolean> {
    const url = `localhost:5000/api/auth/accountConfirmation?token=${token}`;

    const response = await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome To Let Me Geek! Confirm your Email and lets Geek !!!',
      template: './confirmation',
      context: {
        name: user.username,
        url,
      },
    });

    if (response.accepted.length > 0) {
      return true;
    }

    return false;
  }
}
