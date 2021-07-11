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
import WallsGame from './entities/walls-game.entity';
import { WallsGameDto } from './dto/walls-game.dto';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { UpdateWallsGameDto } from './dto/update-walls-game.dto';
import { WallsGamesService } from './walls-games.service';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('api/wallsgames')
export class WallsGamesController {
  constructor(private readonly wallsGamesService: WallsGamesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/game/:gameIdentifier')
  createRecord(
    @Param('gameIdentifier') gameIdentifier: string,
    @Body() wallsGameDto: WallsGameDto,
    @GetUser() user: User,
  ): Promise<WallsGame> {
    return this.wallsGamesService.createRecord(
      gameIdentifier,
      wallsGameDto,
      user,
    );
  }

  @Get('/:username')
  getRecordsByUser(
    @Param('username') username: string,
    @Query() fitlerDto: WallsFilterDto,
  ): Promise<Array<WallsGame>> {
    return this.wallsGamesService.getRecordsByUser(username, fitlerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/game/:gameIdentifier')
  updateRecord(
    @Param('gameIdentifier') identifier: string,
    @Body() updateWallsGameDto: UpdateWallsGameDto,
    @GetUser() user: User,
  ): Promise<WallsGame> {
    return this.wallsGamesService.updateRecord(
      identifier,
      updateWallsGameDto,
      user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/game/:gameIdentifier')
  @HttpCode(204)
  deleteRecord(
    @Param('gameIdentifier') identifier: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.wallsGamesService.deleteRecord(identifier, user);
  }
}
