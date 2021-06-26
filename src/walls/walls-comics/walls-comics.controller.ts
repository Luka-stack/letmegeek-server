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
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { UpdateWallsComicDto } from './dto/update-walls-comic.dto';
import { WallsComicDto } from './dto/walls-comic.dto';
import WallsComic from './entities/walls-comic.entity';
import { WallsComicsService } from './walls-comics.service';

@Controller('api/wallscomics')
export class WallsComicsController {
  constructor(private readonly wallsComicsService: WallsComicsService) {}

  @Post('/:username/comic/:comicIdentifier')
  createRecord(
    @Param('username') username: string,
    @Param('comicIdentifier') comicIdentifier: string,
    @Body() wallsComicDto: WallsComicDto,
  ): Promise<WallsComic> {
    return this.wallsComicsService.createRecord(
      username,
      comicIdentifier,
      wallsComicDto,
    );
  }

  @Get('/:username')
  getRecordsByUser(
    @Param('username') username: string,
    @Query() fitlerDto: WallsFilterDto,
  ): Promise<Array<WallsComic>> {
    return this.wallsComicsService.getRecordsByUser(username, fitlerDto);
  }

  @Patch('/:username/comic/:comicIdentifier')
  updateRecord(
    @Param('username') username: string,
    @Param('comicIdentifier') identifier: string,
    @Body() updateWallsComicDto: UpdateWallsComicDto,
  ): Promise<WallsComic> {
    return this.wallsComicsService.updateRecord(
      username,
      identifier,
      updateWallsComicDto,
    );
  }

  @Delete('/:username/comic/:comicIdentifier')
  @HttpCode(204)
  deleteRecord(
    @Param('username') username: string,
    @Param('comicIdentifier') identifier: string,
  ): Promise<void> {
    return this.wallsComicsService.deleteRecord(username, identifier);
  }
}
