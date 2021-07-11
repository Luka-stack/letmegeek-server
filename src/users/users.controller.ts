import { Controller, Get, Param, Query } from '@nestjs/common';

import User from './entities/user.entity';
import { UserFilterDto } from './dto/user-filter.dto';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@Query() userFilterDto: UserFilterDto): Promise<Array<User>> {
    return this.usersService.getUsers(userFilterDto);
  }

  @Get('/:username')
  getUserByUsername(@Param('username') username: string) {
    return this.usersService.getUserByUsername(username);
  }
}
