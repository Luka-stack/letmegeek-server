import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import Comic from './entities/comic.entity';
import { ComicDto } from './dto/comic.dto';
import { ComicsRepository } from './comics.repository';
import { UpdateComicDto } from './dto/update-comic.dto';
import { ComicsFilterDto } from './dto/comics-filter.dto';

@Injectable()
export class ComicsService {
  constructor(
    @InjectRepository(ComicsRepository)
    private readonly comicsRepository: ComicsRepository,
  ) {}

  async createComic(comicDto: ComicDto): Promise<Comic> {
    const comic = this.comicsRepository.create(comicDto);
    comic.createdAt = new Date();

    await this.comicsRepository.save(comic).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return comic;
  }

  async getComics(filterDto: ComicsFilterDto): Promise<Array<Comic>> {
    return await this.comicsRepository.getComics(filterDto);
  }

  async updateComic(
    identifier: string,
    slug: string,
    updateComicDto: UpdateComicDto,
  ): Promise<Comic> {
    const comic = await this.comicsRepository.findOne({ identifier, slug });

    if (!comic) {
      throw new NotFoundException('Comic not found');
    }

    comic.updateFields(updateComicDto);

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
      throw new NotFoundException('Comic not found');
    }
  }
}
