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

import User from '../users/entities/user.entity';
import Game from './entities/game.entity';
import { GameDto } from './dto/game.dto';
import { GamesService } from './games.service';
import { UpdateGameDto } from './dto/update-game.dto';
import { GamesFilterDto } from './dto/games-filter.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { HasRoles } from '../auth/decorators/has-roles.decorator';
import { UserRole } from '../auth/entities/user-role';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createGame(@Body() gameDto: GameDto, @GetUser() user: User): Promise<Game> {
    return this.gamesService.createGame(gameDto, user);
  }

  @Get()
  getGames(
    @Query() filterDto: GamesFilterDto,
    @GetUser() user: User,
  ): Promise<Array<Game>> {
    return this.gamesService.getGames(filterDto, user);
  }

  @Get('/:identifier/:slug')
  getOneGame(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
    @GetUser() user: User,
  ): Promise<Game> {
    return this.gamesService.getOneGame(identifier, slug, user);
  }

  @HasRoles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/:identifier/:slug')
  updateGame(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
    @Body() updateGameDto: UpdateGameDto,
  ): Promise<Game> {
    return this.gamesService.updateGame(identifier, slug, updateGameDto);
  }

  @HasRoles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('/:identifier/:slug')
  @HttpCode(204)
  deleteGame(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.gamesService.deleteGame(identifier, slug);
  }
}
