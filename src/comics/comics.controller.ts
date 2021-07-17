import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';

import User from '../users/entities/user.entity';
import Comic from './entities/comic.entity';
import { ComicDto } from './dto/comic.dto';
import { ComicsService } from './comics.service';
import { UpdateComicDto } from './dto/update-comic.dto';
import { ComicsFilterDto } from './dto/comics-filter.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { HasRoles } from '../auth/decorators/has-roles.decorator';
import { UserRole } from '../auth/entities/user-role';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { editFilename, imageFileFilter } from '../utils/file-uploads';
import { PaginatedComicsDto } from './dto/paginated-comics.dto';

const multerOptions = {
  limits: {
    fileSize: 80000,
  },
  storage: diskStorage({
    destination: 'public/images',
    filename: editFilename,
  }),
  fileFilter: imageFileFilter,
};

@Controller('api/comics')
export class ComicsController {
  constructor(private readonly comicsService: ComicsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createComic(
    @Body() comicDto: ComicDto,
    @GetUser() user: User,
  ): Promise<Comic> {
    return this.comicsService.createComic(comicDto, user);
  }

  @Get()
  getComics(
    @Query() filterDto: ComicsFilterDto,
    @GetUser() user: User,
  ): Promise<PaginatedComicsDto> {
    return this.comicsService.getComics(filterDto, user);
  }

  @Get('/:identifier/:slug')
  getOneComic(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
    @GetUser() user: User,
  ): Promise<Comic> {
    return this.comicsService.getOneComic(identifier, slug, user);
  }

  @HasRoles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/:identifier/:slug')
  updateComic(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
    @Body() updateComicDto: UpdateComicDto,
  ): Promise<Comic> {
    return this.comicsService.updateComic(identifier, slug, updateComicDto);
  }

  @HasRoles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('/:identifier/:slug')
  @HttpCode(204)
  deleteComic(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.comicsService.deleteComic(identifier, slug);
  }

  @HasRoles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/:identifier/:slug/upload')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
  ): Promise<Comic> {
    return this.comicsService.uploadImage(file, identifier, slug);
  }
}
