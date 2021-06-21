import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import Game from './entities/game.entity';
import { GameDto } from './dto/game.dto';
import { GamesRepository } from './games.repository';
import { UpdateGameDto } from './dto/update-game.dto';
import { GamesFilterDto } from './dto/games-filter.dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GamesRepository)
    private readonly gamesRepository: GamesRepository,
  ) {}

  async createGame(gameDto: GameDto): Promise<Game> {
    const game = this.gamesRepository.create(gameDto);
    game.createdAt = new Date();

    await this.gamesRepository.save(game).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return game;
  }

  getGames(filterDto: GamesFilterDto): Promise<Array<Game>> {
    return this.gamesRepository.getGames(filterDto);
  }

  async updateGame(
    identifier: string,
    slug: string,
    updateGameDto: UpdateGameDto,
  ): Promise<Game> {
    const game = await this.gamesRepository.findOne({ identifier, slug });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    game.mapDtoToEntity(updateGameDto);
    if (updateGameDto.draft != null && updateGameDto.draft) {
      game.createdAt = new Date();
    }

    await this.gamesRepository.save(game).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return game;
  }

  async deleteGame(identifier: string, slug: string): Promise<void> {
    const result = await this.gamesRepository.delete({ identifier, slug });

    if (result.affected === 0) {
      throw new NotFoundException('Game not found');
    }
  }
}
