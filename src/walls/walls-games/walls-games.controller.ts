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

import WallsGame from './entities/walls-game.entity';
import { WallsGameDto } from './dto/walls-game.dto';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { WallsGamesService } from './walls-games.service';
import { UpdateWallsGameDto } from './dto/update-walls-game.dto';

@Controller('api/wallsgames')
export class WallsGamesController {
  constructor(private readonly wallsGamesService: WallsGamesService) {}

  @Post('/:username/game/:gameIdentifier')
  createRecord(
    @Param('username') username: string,
    @Param('gameIdentifier') gameIdentifier: string,
    @Body() wallsGameDto: WallsGameDto,
  ): Promise<WallsGame> {
    return this.wallsGamesService.createRecord(
      username,
      gameIdentifier,
      wallsGameDto,
    );
  }

  @Get('/:username')
  getRecordsByUser(
    @Param('username') username: string,
    @Query() fitlerDto: WallsFilterDto,
  ): Promise<Array<WallsGame>> {
    return this.wallsGamesService.getRecordsByUser(username, fitlerDto);
  }

  @Patch('/:username/game/:gameIdentifier')
  updateRecord(
    @Param('username') username: string,
    @Param('gameIdentifier') identifier: string,
    @Body() updateWallsGameDto: UpdateWallsGameDto,
  ): Promise<WallsGame> {
    return this.wallsGamesService.updateRecord(
      username,
      identifier,
      updateWallsGameDto,
    );
  }

  @Delete('/:username/game/:gameIdentifier')
  @HttpCode(204)
  deleteRecord(
    @Param('username') username: string,
    @Param('gameIdentifier') identifier: string,
  ): Promise<void> {
    return this.wallsGamesService.deleteRecord(username, identifier);
  }
}
