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

import { ComicsService } from './comics.service';
import { CreateComicDto } from './dto/create-comic.dto';
import { UpdateComicDto } from './dto/update-comic.dto';
import Comic from './entities/comic.entity';

@Controller('api/comics')
export class ComicsController {
  constructor(private readonly comicsService: ComicsService) {}

  @Post()
  createComic(@Body() createComicDto: CreateComicDto): Promise<Comic> {
    return this.comicsService.createComic(createComicDto);
  }

  @Get()
  getComics(): Promise<Array<Comic>> {
    return this.comicsService.getComics();
  }

  @Patch('/:identifier')
  updateComic(
    @Param('identifier') identifier: string,
    @Body() updateComicDto: UpdateComicDto,
  ): Promise<Comic> {
    return this.comicsService.updateComic(identifier, updateComicDto);
  }

  @Delete('/:identifier')
  @HttpCode(204)
  deleteComic(@Param('identifier') identifier: string): Promise<void> {
    return this.comicsService.deleteComic(identifier);
  }
}
