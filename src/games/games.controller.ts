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

import Game from './entities/game.entity';
import { GamesService } from './games.service';
import { UpdateGameDto } from './dto/update-game.dto';
import { GameDto } from './dto/game.dto';
import { GamesFilterDto } from './dto/games-filter.dto';

@Controller('api/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  createGame(@Body() gameDto: GameDto): Promise<Game> {
    return this.gamesService.createGame(gameDto);
  }

  @Get()
  getGames(@Query() filterDto: GamesFilterDto): Promise<Array<Game>> {
    return this.gamesService.getGames(filterDto);
  }

  @Patch('/:identifier/:slug')
  updateGame(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
    @Body() updateGameDto: UpdateGameDto,
  ): Promise<Game> {
    return this.gamesService.updateGame(identifier, slug, updateGameDto);
  }

  @Delete('/:identifier/slug')
  @HttpCode(204)
  deleteGame(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.gamesService.deleteGame(identifier, slug);
  }
}
