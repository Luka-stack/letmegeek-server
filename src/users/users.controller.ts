import { Controller, Get, Param, Query } from '@nestjs/common';

import User from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@Query() username: string): Promise<Array<User>> {
    return this.usersService.getUsers(username);
  }

  @Get('/:username')
  getUserByUsername(@Param('username') username: string) {
    return this.usersService.getUserByUsername(username);
  }
}
