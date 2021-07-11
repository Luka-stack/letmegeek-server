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

import User from '../../users/entities/user.entity';
import WallsComic from './entities/walls-comic.entity';
import { WallsComicDto } from './dto/walls-comic.dto';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { UpdateWallsComicDto } from './dto/update-walls-comic.dto';
import { WallsComicsService } from './walls-comics.service';
import { GetUser } from '../..//auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('api/wallscomics')
export class WallsComicsController {
  constructor(private readonly wallsComicsService: WallsComicsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/comic/:comicIdentifier')
  createRecord(
    @Param('comicIdentifier') comicIdentifier: string,
    @Body() wallsComicDto: WallsComicDto,
    @GetUser() user: User,
  ): Promise<WallsComic> {
    return this.wallsComicsService.createRecord(
      comicIdentifier,
      wallsComicDto,
      user,
    );
  }

  @Get('/:username')
  getRecordsByUser(
    @Param('username') username: string,
    @Query() fitlerDto: WallsFilterDto,
  ): Promise<Array<WallsComic>> {
    return this.wallsComicsService.getRecordsByUser(username, fitlerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/comic/:comicIdentifier')
  updateRecord(
    @Param('comicIdentifier') identifier: string,
    @Body() updateWallsComicDto: UpdateWallsComicDto,
    @GetUser() user: User,
  ): Promise<WallsComic> {
    return this.wallsComicsService.updateRecord(
      identifier,
      updateWallsComicDto,
      user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/comic/:comicIdentifier')
  @HttpCode(204)
  deleteRecord(
    @Param('comicIdentifier') identifier: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.wallsComicsService.deleteRecord(identifier, user);
  }
}
