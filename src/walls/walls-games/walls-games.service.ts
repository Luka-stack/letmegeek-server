import { SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import WallsGame from './entities/walls-game.entity';
import { WallsGameDto } from './dto/walls-game.dto';
import { WallArticleStatus } from '../entities/wall-article-status';
import { GamesRepository } from '../../games/games.repository';
import { UsersRepository } from '../../users/users.repository';
import { UpdateWallsGameDto } from './dto/update-walls-game.dto';
import { WallsGamesRepository } from './walls-games.repository';
import { WallsFilterDto } from '../dto/wall-filter.dto';

@Injectable()
export class WallsGamesService {
  constructor(
    @InjectRepository(WallsGamesRepository)
    private readonly wallsGamesRepository: WallsGamesRepository,
    @InjectRepository(UsersRepository)
    private readonly usersRepository: UsersRepository,
    @InjectRepository(GamesRepository)
    private readonly gamesRepository: GamesRepository,
  ) {}

  async createRecord(
    username: string,
    gameIdentifier: string,
    wallsGameDto: WallsGameDto,
  ): Promise<WallsGame> {
    const user = await this.usersRepository.findOne({ username });
    const game = await this.gamesRepository.findOne({
      identifier: gameIdentifier,
    });

    const wallsGame = this.wallsGamesRepository.create({
      user,
      game,
      status: WallArticleStatus.COMPLETED,
      hoursPlayed: wallsGameDto.hoursPlayed,
    });

    await this.wallsGamesRepository.save(wallsGame);

    return wallsGame;
  }

  async updateRecord(
    username: string,
    identifier: string,
    updateWallsGameDto: UpdateWallsGameDto,
  ): Promise<WallsGame> {
    const wallsGame = await this.wallsGamesRepository.findOne({
      where: (book: SelectQueryBuilder<WallsGame>) => {
        book
          .where('WallsGame_game.identifier = :identifier', { identifier })
          .andWhere('username = :username', { username });
      },
    });

    if (!wallsGame) {
      throw new NotFoundException('Game not found in users wall');
    }

    wallsGame.updateFields(updateWallsGameDto);
    const response = await this.wallsGamesRepository.save(wallsGame);

    return response;
  }

  async deleteRecord(username: string, identifier: string): Promise<void> {
    const wallsGame = await this.wallsGamesRepository.findOne({
      where: (book: SelectQueryBuilder<WallsGame>) => {
        book
          .where('WallsGame_game.identifier = :identifier', { identifier })
          .andWhere('username = :username', { username });
      },
    });

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
