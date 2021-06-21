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
} from '@nestjs/common';

import Manga from './entities/manga.entity';
import { MangaDto } from './dto/manga.dto';
import { MangasService } from './mangas.service';
import { UpdateMangaDto } from './dto/update-manga.dto';
import { MangasFilterDto } from './dto/mangas-filter.dto';

@Controller('api/mangas')
export class MangasController {
  constructor(private readonly mangasService: MangasService) {}

  @Post()
  createManga(@Body() mangaDto: MangaDto): Promise<Manga> {
    return this.mangasService.createManga(mangaDto);
  }

  @Get()
  getMangas(@Query() filterDto: MangasFilterDto): Promise<Array<Manga>> {
    return this.mangasService.getMangas(filterDto);
  }

  @Patch('/:identifier/:slug')
  updateManga(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
    @Body() updateMangaDto: UpdateMangaDto,
  ): Promise<Manga> {
    return this.mangasService.updateManga(identifier, slug, updateMangaDto);
  }

  @Delete('/:identifier/:slug')
  @HttpCode(204)
  deleteManga(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.mangasService.deleteManga(identifier, slug);
  }
}
