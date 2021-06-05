import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import Manga from './entities/manga.entity';
import { CreateMangaDto } from './dto/create-manga.dto';
import { MangasService } from './mangas.service';
import { UpdateMangaDto } from './dto/update-manga.dto';

@Controller('api/mangas')
export class MangasController {
  constructor(private readonly mangasService: MangasService) {}

  @Post()
  createManga(@Body() createMangaDto: CreateMangaDto): Promise<Manga> {
    return this.mangasService.createManga(createMangaDto);
  }

  @Get()
  getMangas(): Promise<Array<Manga>> {
    return this.mangasService.getMangas();
  }

  @Patch('/:identifier')
  updateManga(
    @Param('identifier') identifier: string,
    @Body() updateMangaDto: UpdateMangaDto,
  ): Promise<Manga> {
    return this.mangasService.updateManga(identifier, updateMangaDto);
  }

  @Delete('/:identifier')
  @HttpCode(204)
  deleteManga(@Param('identifier') identifier: string): Promise<void> {
    return this.mangasService.deleteManga(identifier);
  }
}
