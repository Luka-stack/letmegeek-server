import { SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { WallsBooksRepository } from '../../walls/walls-books/walls-books.repository';
import { WallsComicsRepository } from '../../walls/walls-comics/walls-comics.repository';
import { WallsGamesRepository } from '../../walls/walls-games/walls-games.repository';
import { WallsMangasRepository } from '../../walls/walls-mangas/walls-mangas.repository';

@Injectable()
export class UserStatsService {
  constructor(
    @InjectRepository(WallsBooksRepository)
    private readonly wallsBooksRepository: WallsBooksRepository,
    @InjectRepository(WallsMangasRepository)
    private readonly wallsMangasRepository: WallsMangasRepository,
    @InjectRepository(WallsComicsRepository)
    private readonly wallsComicsRepository: WallsComicsRepository,
    @InjectRepository(WallsGamesRepository)
    private readonly wallsGamesRepository: WallsGamesRepository,
  ) {}

  async getUsersArticleStats(article: string, username: string) {
    let query: SelectQueryBuilder<any>;
    switch (article) {
      case 'books':
        query = this.wallsBooksRepository.createQueryBuilder('wall');
        break;
      case 'comics':
        query = this.wallsMangasRepository.createQueryBuilder('wall');
        break;
      case 'mangas':
        query = this.wallsComicsRepository.createQueryBuilder('wall');
        break;
      case 'games':
        query = this.wallsGamesRepository.createQueryBuilder('wall');
        break;
    }

    try {
      return await query
        .select('AVG(wall.score)', 'avgScore')
        .addSelect('COUNT(wall.id)', 'count')
        .addSelect('wall.status', 'status')
        .where('wall.username = :username', { username })
        .groupBy('wall.status')
        .getRawMany();
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async getLastUsersUpdates(
    article: string,
    username: string,
    limit = 3,
  ): Promise<Array<any>> {
    let repository;
    switch (article) {
      case 'books':
        repository = this.wallsBooksRepository;
        break;
      case 'comics':
        repository = this.wallsComicsRepository;
        break;
      case 'mangas':
        repository = this.wallsMangasRepository;
        break;
      case 'games':
        repository = this.wallsGamesRepository;
        break;
    }

    try {
      return await repository.find({
        where: {
          username: username,
        },
        order: {
          updatedAt: 'DESC',
        },
        take: limit,
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }
}
