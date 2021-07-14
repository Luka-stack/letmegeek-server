import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';

import Game from './entities/game.entity';
import User from '../users/entities/user.entity';
import { GameDto } from './dto/game.dto';
import { UserRole } from '../auth/entities/user-role';
import { UpdateGameDto } from './dto/update-game.dto';
import { GamesFilterDto } from './dto/games-filter.dto';
import { GamesRepository } from './games.repository';
import { removeSpacesFromCommaSeparatedString } from '../utils/helpers';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GamesRepository)
    private readonly gamesRepository: GamesRepository,
  ) {}

  async createGame(gameDto: GameDto, user: User): Promise<Game> {
    if (user.role === UserRole.USER) {
      gameDto.draft = true;
    }

    if (gameDto.authors) {
      gameDto.authors = removeSpacesFromCommaSeparatedString(gameDto.authors);
    }

    if (gameDto.gears) {
      gameDto.gears = removeSpacesFromCommaSeparatedString(gameDto.gears);
    }

    if (gameDto.publishers) {
      gameDto.publishers = removeSpacesFromCommaSeparatedString(
        gameDto.publishers,
      );
    }

    if (gameDto.genres) {
      gameDto.genres = removeSpacesFromCommaSeparatedString(gameDto.genres);
    }

    const game = this.gamesRepository.create(gameDto);
    game.createdAt = new Date();

    await this.gamesRepository.save(game).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return game;
  }

  getGames(filterDto: GamesFilterDto, user: User): Promise<Array<Game>> {
    return this.gamesRepository
      .getGames(filterDto)
      .then((result: Array<Game>) => {
        if (user) {
          result.map((game: Game) => {
            const wall = game.wallsGames.find(
              (wall) => wall.username === user.username,
            );
            game.userWallsGame = wall;
          });
        }

        return result;
      });
  }

  async getOneGame(
    identifier: string,
    slug: string,
    user: User,
  ): Promise<Game> {
    return await this.gamesRepository
      .getCompleteGame(identifier, slug, user)
      .then((result: Game) => {
        if (!result) {
          throw new NotFoundException('Game not found');
        }

        if (user) {
          const wall = result.wallsGames.find(
            (wall) => wall.username === user.username,
          );
          result.userWallsGame = wall;
        }

        return result;
      });
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

    if (updateGameDto.authors) {
      updateGameDto.authors = removeSpacesFromCommaSeparatedString(
        updateGameDto.authors,
      );
    }

    if (updateGameDto.publishers) {
      updateGameDto.publishers = removeSpacesFromCommaSeparatedString(
        updateGameDto.publishers,
      );
    }

    if (updateGameDto.genres) {
      updateGameDto.genres = removeSpacesFromCommaSeparatedString(
        updateGameDto.genres,
      );
    }

    if (updateGameDto.gears) {
      updateGameDto.gears = removeSpacesFromCommaSeparatedString(
        updateGameDto.gears,
      );
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

  async uploadImage(
    file: Express.Multer.File,
    identifier: string,
    slug: string,
  ): Promise<Game> {
    const game = await this.gamesRepository.findOne({ identifier, slug });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const oldImage = game.imageUrn || '';
    game.imageUrn = file.filename;

    await this.gamesRepository.save(game);

    if (oldImage !== '') {
      fs.unlinkSync(`public\\images\\${oldImage}`);
    }

    return game;
  }
}
