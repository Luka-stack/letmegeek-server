import { JwtService } from '@nestjs/jwt';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request } from 'express';

import User from '../../users/entities/user.entity';
import { UsersRepository } from '../../users/users.repository';

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const data = req.cookies['Auth-Cookie'];
    let user: User = undefined;

    if (data) {
      const { email } = this.jwtService.verify(
        data,
        this.configService.get('JWT_SECRET'),
      );
      user = await this.usersRepository.findOne({ email });
    }

    req.user = user;
    next();
  }
}
