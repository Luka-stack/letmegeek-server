import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import User from '../users/entities/user.entity';
import Comic from './entities/comic.entity';
import { ComicDto } from './dto/comic.dto';
import { UserRole } from '../auth/entities/user-role';
import { UpdateComicDto } from './dto/update-comic.dto';
import { ComicsFilterDto } from './dto/comics-filter.dto';
import { ComicsRepository } from './comics.repository';
import { removeSpacesFromCommaSeparatedString } from '../utils/helpers';

@Injectable()
export class ComicsService {
  constructor(
    @InjectRepository(ComicsRepository)
    private readonly comicsRepository: ComicsRepository,
  ) {}

  async createComic(comicDto: ComicDto, user: User): Promise<Comic> {
    if (user.role == UserRole.USER) {
      comicDto.draft = true;
    }

    if (comicDto.authors) {
      comicDto.authors = removeSpacesFromCommaSeparatedString(comicDto.authors);
    }

    if (comicDto.publishers) {
      comicDto.publishers = removeSpacesFromCommaSeparatedString(
        comicDto.publishers,
      );
    }

    if (comicDto.genres) {
      comicDto.genres = removeSpacesFromCommaSeparatedString(comicDto.genres);
    }

    const comic = this.comicsRepository.create(comicDto);
    comic.createdAt = new Date();

    await this.comicsRepository.save(comic).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return comic;
  }

  async getComics(
    filterDto: ComicsFilterDto,
    user: User,
  ): Promise<Array<Comic>> {
    return await this.comicsRepository
      .getComics(filterDto)
      .then((result: Array<Comic>) => {
        if (user) {
          result.map((comic: Comic) => {
            const wall = comic.wallsComics.find(
              (wall) => wall.username === user.username,
            );
            comic.userWallsComic = wall;
          });
        }

        return result;
      });
  }

  async getOneComic(
    identifier: string,
    slug: string,
    user: User,
  ): Promise<Comic> {
    return await this.comicsRepository
      .getCompleteComic(identifier, slug, user)
      .then((result: Comic) => {
        if (!result) {
          throw new NotFoundException('Comic book not found');
        }

        if (user) {
          const wall = result.wallsComics.find(
            (wall) => wall.username === user.username,
          );
          result.userWallsComic = wall;
        }

        return result;
      });
  }

  async updateComic(
    identifier: string,
    slug: string,
    updateComicDto: UpdateComicDto,
  ): Promise<Comic> {
    const comic = await this.comicsRepository.findOne({ identifier, slug });

    if (!comic) {
      throw new NotFoundException('Comic book not found');
    }

    if (updateComicDto.authors) {
      updateComicDto.authors = removeSpacesFromCommaSeparatedString(
        updateComicDto.authors,
      );
    }

    if (updateComicDto.publishers) {
      updateComicDto.publishers = removeSpacesFromCommaSeparatedString(
        updateComicDto.publishers,
      );
    }

    if (updateComicDto.genres) {
      updateComicDto.genres = removeSpacesFromCommaSeparatedString(
        updateComicDto.genres,
      );
    }

    comic.mapDtoToEntity(updateComicDto);
    if (updateComicDto.draft != null && updateComicDto.draft) {
      comic.createdAt = new Date();
    }

    await this.comicsRepository.save(comic).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return comic;
  }

  async deleteComic(identifier: string, slug: string): Promise<void> {
    const result = await this.comicsRepository.delete({ identifier, slug });

    if (result.affected === 0) {
      throw new NotFoundException('Comic book not found');
    }
  }
}
