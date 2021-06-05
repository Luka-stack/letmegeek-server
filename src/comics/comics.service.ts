import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import Comic from './entities/comic.entity';
import { ComicsRepository } from './comics.repository';
import { CreateComicDto } from './dto/create-comic.dto';
import { UpdateComicDto } from './dto/update-comic.dto';

@Injectable()
export class ComicsService {
  constructor(
    @InjectRepository(ComicsRepository)
    private readonly comicsRepository: ComicsRepository,
  ) {}

  createComic(createComicDto: CreateComicDto): Promise<Comic> {
    return this.comicsRepository.createComic(createComicDto);
  }

  async getComics(): Promise<Array<Comic>> {
    return await this.comicsRepository.find();
  }

  async updateComic(
    identifier: string,
    updateComicDto: UpdateComicDto,
  ): Promise<Comic> {
    const comic = await this.comicsRepository.findOne({ identifier });

    if (!comic) {
      throw new NotFoundException('Comic not found');
    }

    comic.title = updateComicDto.title || comic.title;
    comic.author = updateComicDto.author || comic.author;
    comic.series = updateComicDto.series || comic.series;
    comic.description = updateComicDto.description || comic.description;
    comic.publisher = updateComicDto.publisher || comic.publisher;
    comic.premiered = updateComicDto.premiered || comic.premiered;
    comic.draft = updateComicDto.draft || comic.draft;

    await this.comicsRepository.save(comic);
    return comic;
  }

  async deleteComic(identifier: string): Promise<void> {
    const result = await this.comicsRepository.delete({ identifier });

    if (result.affected === 0) {
      throw new NotFoundException('Comic not found');
    }
  }
}
