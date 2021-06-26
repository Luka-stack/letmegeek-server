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

import WallsManga from './entities/walls-manga.entity';
import { WallsMangaDto } from './dto/walls-manga.dto';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { WallsMangasService } from './walls-mangas.service';
import { UpdateWallsMangaDto } from './dto/update-walls-manga.dto';

@Controller('api/wallsmangas')
export class WallsMangasController {
  constructor(private readonly wallsMangasService: WallsMangasService) {}

  @Post('/:username/manga/:mangaIdentifier')
  createRecord(
    @Param('username') username: string,
    @Param('mangaIdentifier') mangaIdentifier: string,
    @Body() wallsMangaDto: WallsMangaDto,
  ): Promise<WallsManga> {
    return this.wallsMangasService.createRecord(
      username,
      mangaIdentifier,
      wallsMangaDto,
    );
  }

  @Get('/:username')
  getRecordsByUser(
    @Param('username') username: string,
    @Query() filterDto: WallsFilterDto,
  ): Promise<Array<WallsManga>> {
    return this.wallsMangasService.getRecordsByUser(username, filterDto);
  }

  @Patch('/:username/manga/:mangaIdentifier')
  updateRecord(
    @Param('username') username: string,
    @Param('mangaIdentifier') identifier: string,
    @Body() updateWallsMangaDto: UpdateWallsMangaDto,
  ): Promise<WallsManga> {
    return this.wallsMangasService.updateRecord(
      username,
      identifier,
      updateWallsMangaDto,
    );
  }

  @Delete('/:username/manga/:mangaIdentifier')
  @HttpCode(204)
  deleteRecord(
    @Param('username') username: string,
    @Param('mangaIdentifier') identifier: string,
  ): Promise<void> {
    return this.wallsMangasService.deleteRecord(username, identifier);
  }
}
