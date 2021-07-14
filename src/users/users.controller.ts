import {
  Controller,
  Get,
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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

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
  getUsers(@Query() userFilterDto: UserFilterDto): Promise<Array<User>> {
    return this.usersService.getUsers(userFilterDto);
  }

  @Get('/:username')
  getUserByUsername(@Param('username') username: string) {
    return this.usersService.getUserByUsername(username);
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
}
