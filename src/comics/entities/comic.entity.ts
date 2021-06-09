import { Column, Entity } from 'typeorm';

import Article from '../../shared/entities/article.entity';
import { UpdateComicDto } from '../dto/update-comic.dto';

@Entity('comics')
export default class Comic extends Article {
  @Column({ nullable: true })
  issues: number;

  @Column({ nullable: true })
  finished: Date;

  @Column({ nullable: true })
  premiered: Date;

  updateFields(updateComicDto: UpdateComicDto) {
    this.title = updateComicDto.title || this.title;
    this.issues = updateComicDto.issues || this.issues;
    this.description = updateComicDto.description || this.description;
    this.premiered = updateComicDto.premiered || this.premiered;
    this.finished = updateComicDto.finished || this.finished;
    this.genres = updateComicDto.genres || this.genres;
    this.authors = updateComicDto.authors || this.authors;
    this.publishers = updateComicDto.publishers || this.publishers;

    if (updateComicDto.draft != null) {
      this.draft = updateComicDto.draft;
      if (updateComicDto.draft) {
        this.createdAt = new Date();
      }
    }
  }
}
