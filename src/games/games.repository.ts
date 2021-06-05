import { EntityRepository, Repository } from 'typeorm';

import { CreateGameDto } from './dto/create-game.dto';
import Game from './entities/game.entity';

@EntityRepository(Game)
export class GamesRepository extends Repository<Game> {
  async createGame(createGameDto: CreateGameDto): Promise<Game> {
    const game = this.create({
      title: createGameDto.title,
      studio: createGameDto.studio,
      description: createGameDto.description,
      publisher: createGameDto.publisher,
      premiered: createGameDto.premiered,
      draft: createGameDto.draft,
    });

    await this.save(game);
    return game;
  }
}
