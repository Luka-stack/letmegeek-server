import { EntityRepository, Repository } from 'typeorm';

import Comic from './entities/comic.entity';
import { CreateComicDto } from './dto/create-comic.dto';

@EntityRepository(Comic)
export class ComicsRepository extends Repository<Comic> {
  async createComic(createComicDto: CreateComicDto): Promise<Comic> {
    const comic = this.create({
      title: createComicDto.title,
      author: createComicDto.author,
      description: createComicDto.description,
      publisher: createComicDto.publisher,
      premiered: createComicDto.premiered,
      draft: createComicDto.draft,
    });

    await this.save(comic);
    return comic;
  }
}
