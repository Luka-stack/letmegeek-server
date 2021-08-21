import { SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import Game from '../../games/entities/game.entity';
import User from '../../users/entities/user.entity';
import WallsGame from './entities/walls-game.entity';
import { WallsGameDto } from './dto/walls-game.dto';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { UpdateWallsGameDto } from './dto/update-walls-game.dto';
import { GamesRepository } from '../../games/games.repository';
import { WallsGamesRepository } from './walls-games.repository';
import { WallArticleStatus } from '../entities/wall-article-status';

@Injectable()
export class WallsGamesService {
  constructor(
    @InjectRepository(WallsGamesRepository)
    private readonly wallsGamesRepository: WallsGamesRepository,
    @InjectRepository(GamesRepository)
    private readonly gamesRepository: GamesRepository,
  ) {}

  async createRecord(
    gameIdentifier: string,
    wallsGameDto: WallsGameDto,
    user: User,
  ): Promise<WallsGame> {
    const game = await this.gamesRepository
      .findOne({
        identifier: gameIdentifier,
      })
      .then((result: Game) => {
        if (!result) {
          throw new NotFoundException('Game not found');
        }

        return result;
      });

    await this.wallsGamesRepository
      .findOne({ username: user.username, game })
      .then((result) => {
        if (result) {
          throw new ConflictException('Game already exsits in users wall');
        }
      });

    const wallsGame = this.wallsGamesRepository.create({
      user,
      game,
      ...wallsGameDto,
    });

    await this.wallsGamesRepository.save(wallsGame);

    return wallsGame;
  }

  async updateRecord(
    identifier: string,
    updateWallsGameDto: UpdateWallsGameDto,
    user: User,
  ): Promise<WallsGame> {
    const wallsGame = await this.wallsGamesRepository.findUserRecordByGame(
      identifier,
      user.username,
    );

    if (!wallsGame) {
      throw new NotFoundException('Game not found in users wall');
    }

    wallsGame.updateFields(updateWallsGameDto);
    const response = await this.wallsGamesRepository.save(wallsGame);

    return response;
  }

  async deleteRecord(identifier: string, user: User): Promise<void> {
    const wallsGame = await this.wallsGamesRepository.findUserRecordByGame(
      identifier,
      user.username,
    );

    if (!wallsGame) {
      throw new NotFoundException('Game not found in users wall');
    }

    await this.wallsGamesRepository.delete({ id: wallsGame.id });
  }

  getRecordsByUser(
    username: string,
    fitlerDto: WallsFilterDto,
  ): Promise<Array<WallsGame>> {
    return this.wallsGamesRepository.getRecords(username, fitlerDto);
  }
}
