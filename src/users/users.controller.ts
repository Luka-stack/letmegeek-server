import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';

import User from './entities/user.entity';
import { UserFilterDto } from './dto/user-filter.dto';
import { UsersService } from './users.service';
import { editFilename, imageFileFilter } from '../utils/file-uploads';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { HasRoles } from '../auth/decorators/has-roles.decorator';
import { UserRole } from '../auth/entities/user-role';
import { UserUpdateStatusDto, UserUpdateRoleDto } from './dto/user-update.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UserStatsFilterDto } from './dto/user-stats-filter.dto';
import { UserDetailsFilterDto } from './dto/user-details-filter.dto';

const multerOptions = {
  limits: {
    fileSize: 80000,
  },
  storage: diskStorage({
    destination: 'public/profileImages',
    filename: editFilename,
  }),
  fileFilter: imageFileFilter,
};

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@Query() userFilterDto: UserFilterDto): Promise<PaginatedUsersDto> {
    return this.usersService.getUsers(userFilterDto);
  }

  @Get('/:username')
  getUserByUsername(
    @Query() userDetailsFilter: UserDetailsFilterDto,
    @Param('username') username: string,
  ) {
    return this.usersService.getUserByUsername(username, userDetailsFilter);
  }

  @Get('/:username/stats')
  getUsersStats(
    @Param('username') username: string,
    @Query() userStatsFilter: UserStatsFilterDto,
  ) {
    return this.usersService.getUsersArticleStats(username, userStatsFilter);
  }

  @UseGuards(JwtAuthGuard)
  @HasRoles(UserRole.ADMIN)
  @Post('/:username/blocked')
  changeUserBlockedStatus(
    @Param('username') username: string,
    @Body() blockedStatusDto: UserUpdateStatusDto,
  ): Promise<User> {
    return this.usersService.changeUserBlockedStatus(
      username,
      blockedStatusDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @HasRoles(UserRole.ADMIN)
  @Post('/:username/role')
  changeUserRole(
    @Param('username') username: string,
    @Body() userRoleDto: UserUpdateRoleDto,
  ): Promise<User> {
    return this.usersService.changeUserRole(username, userRoleDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/upload')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ): Promise<User> {
    return this.usersService.uploadProfileImage(file, user);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Delete('/account')
  deleteUsersAccount(@GetUser() user: User): Promise<void> {
    return this.usersService.deleteUsersAccount(user);
  }
}
