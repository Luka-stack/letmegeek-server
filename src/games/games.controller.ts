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

import Game from './entities/game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { GamesService } from './games.service';
import { UpdateGameDto } from './dto/update-game.dto';

@Controller('api/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  createGame(@Body() createGameDto: CreateGameDto): Promise<Game> {
    return this.gamesService.createGame(createGameDto);
  }

  @Get()
  getGames(): Promise<Array<Game>> {
    return this.gamesService.getGames();
  }

  @Patch('/:identifier')
  updateGame(
    @Param('identifier') identifier: string,
    @Body() updateGameDto: UpdateGameDto,
  ): Promise<Game> {
    return this.gamesService.updateGame(identifier, updateGameDto);
  }

  @Delete('/:identifier')
  @HttpCode(204)
  deleteGame(@Param('identifier') identifier: string): Promise<void> {
    return this.gamesService.deleteGame(identifier);
  }
}
