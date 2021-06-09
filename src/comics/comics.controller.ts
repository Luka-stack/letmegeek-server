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

import Comic from './entities/comic.entity';
import { ComicDto } from './dto/comic.dto';
import { ComicsService } from './comics.service';
import { UpdateComicDto } from './dto/update-comic.dto';
import { ComicsFilterDto } from './dto/comics-filter.dto';

@Controller('api/comics')
export class ComicsController {
  constructor(private readonly comicsService: ComicsService) {}

  @Post()
  createComic(@Body() comicDto: ComicDto): Promise<Comic> {
    return this.comicsService.createComic(comicDto);
  }

  @Get()
  getComics(@Query() filterDto: ComicsFilterDto): Promise<Array<Comic>> {
    return this.comicsService.getComics(filterDto);
  }

  @Patch('/:identifier/:slug')
  updateComic(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
    @Body() updateComicDto: UpdateComicDto,
  ): Promise<Comic> {
    return this.comicsService.updateComic(identifier, slug, updateComicDto);
  }

  @Delete('/:identifier/:slug')
  @HttpCode(204)
  deleteComic(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.comicsService.deleteComic(identifier, slug);
  }
}
