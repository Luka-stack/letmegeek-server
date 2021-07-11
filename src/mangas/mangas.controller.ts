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
  UseGuards,
} from '@nestjs/common';

import User from '../users/entities/user.entity';
import Manga from './entities/manga.entity';
import { MangaDto } from './dto/manga.dto';
import { MangasService } from './mangas.service';
import { UpdateMangaDto } from './dto/update-manga.dto';
import { MangasFilterDto } from './dto/mangas-filter.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../auth/entities/user-role';
import { HasRoles } from '../auth/decorators/has-roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/mangas')
export class MangasController {
  constructor(private readonly mangasService: MangasService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createManga(
    @Body() mangaDto: MangaDto,
    @GetUser() user: User,
  ): Promise<Manga> {
    return this.mangasService.createManga(mangaDto, user);
  }

  @Get()
  getMangas(
    @Query() filterDto: MangasFilterDto,
    @GetUser() user: User,
  ): Promise<Array<Manga>> {
    return this.mangasService.getMangas(filterDto, user);
  }

  @Get('/:identifier/:slug')
  getOneManga(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
    @GetUser() user: User,
  ): Promise<Manga> {
    return this.mangasService.getOneManga(identifier, slug, user);
  }

  @HasRoles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/:identifier/:slug')
  updateManga(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
    @Body() updateMangaDto: UpdateMangaDto,
  ): Promise<Manga> {
    return this.mangasService.updateManga(identifier, slug, updateMangaDto);
  }

  @HasRoles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('/:identifier/:slug')
  @HttpCode(204)
  deleteManga(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.mangasService.deleteManga(identifier, slug);
  }
}
