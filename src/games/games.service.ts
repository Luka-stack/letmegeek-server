import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import Game from './entities/game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { GamesRepository } from './games.repository';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GamesRepository)
    private readonly gamesRepository: GamesRepository,
  ) {}

  createGame(createGameDto: CreateGameDto): Promise<Game> {
    return this.gamesRepository.createGame(createGameDto);
  }

  async getGames(): Promise<Array<Game>> {
    return this.gamesRepository.find();
  }

  async updateGame(
    identifier: string,
    updateGameDto: UpdateGameDto,
  ): Promise<Game> {
    const game = await this.gamesRepository.findOne({ identifier });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    game.title = updateGameDto.title || game.title;
    game.studio = updateGameDto.studio || game.studio;
    game.description = updateGameDto.description || game.description;
    game.publisher = updateGameDto.publisher || game.publisher;
    game.premiered = updateGameDto.premiered || game.premiered;
    game.draft = updateGameDto.draft || game.draft;

    await this.gamesRepository.save(game);

    return game;
  }

  async deleteGame(identifier: string): Promise<void> {
    const result = await this.gamesRepository.delete({ identifier });

    if (result.affected === 0) {
      throw new NotFoundException('Game not found');
    }
  }
}
