import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';

import Game from './entities/game.entity';
import User from '../../users/entities/user.entity';
import { GameDto } from './dto/game.dto';
import { UserRole } from '../../auth/entities/user-role';
import { UpdateGameDto } from './dto/update-game.dto';
import { GamesFilterDto } from './dto/games-filter.dto';
import { GamesRepository } from './games.repository';
import { removeSpacesFromCommaSeparatedString } from '../../utils/helpers';
import { PaginatedGamesDto } from './dto/paginated-games.dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GamesRepository)
    private readonly gamesRepository: GamesRepository,
    private readonly configService: ConfigService,
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
    game.contributor = user.username;
    game.accepted = !gameDto.draft;

    await this.gamesRepository.save(game).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return game;
  }

  async getGames(
    filterDto: GamesFilterDto,
    user: User,
  ): Promise<PaginatedGamesDto> {
    filterDto.limit = Number(filterDto.limit);
    filterDto.page = Number(filterDto.page);

    const totalCount = await this.gamesRepository.getFilterCount(filterDto);
    const games = await this.gamesRepository.getGames(
      filterDto,
      user?.username,
    );

    const apiQuery = this.createQuery(filterDto);

    const nextPage = `${this.configService.get(
      'APP_URL',
    )}/api/articles/games?${apiQuery}page=${filterDto.page + 1}&limit=${
      filterDto.limit
    }`;
    const prevPage = `${this.configService.get(
      'APP_URL',
    )}/api/articles/games?${apiQuery}page=${filterDto.page - 1}&limit=${
      filterDto.limit
    }`;

    return {
      totalCount,
      page: filterDto.page,
      limit: filterDto.limit,
      data: games,
      nextPage: filterDto.page * filterDto.limit < totalCount ? nextPage : '',
      prevPage: filterDto.page >= 2 ? prevPage : '',
    };
  }

  async getOneGame(identifier: string, slug: string, user: User): Promise<any> {
    const game = await this.gamesRepository.getGame(
      identifier,
      slug,
      user?.username,
    );

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return game;
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

  createQuery(filterDto: GamesFilterDto): string {
    let query = '';

    if (filterDto.completeTime) {
      query += `completeTime=${filterDto.completeTime}&`;
    }

    if (filterDto.gameMode) {
      query += `gameMode=${filterDto.gameMode}&`;
    }

    if (filterDto.gears) {
      query += `gears=${filterDto.gears}&`;
    }

    if (filterDto.authors) {
      query += `authors=${filterDto.authors}&`;
    }

    if (filterDto.genres) {
      query += `genres=${filterDto.genres}&`;
    }

    if (filterDto.name) {
      query += `name=${filterDto.name}&`;
    }

    if (filterDto.premiered) {
      query += `premiered=${filterDto.premiered}&`;
    }

    if (filterDto.publishers) {
      query += `publishers=${filterDto.publishers}&`;
    }

    if (filterDto.orderBy) {
      query += `orderBy=${filterDto.orderBy}&`;
    }

    if (filterDto.ordering) {
      query += `ordering=${filterDto.ordering}&`;
    }

    return query;
  }
}
