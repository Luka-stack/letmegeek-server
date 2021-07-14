import { Exclude, Expose } from 'class-transformer';
import { Column, Entity, OneToMany } from 'typeorm';

import Article from '../../shared/entities/article.entity';
import WallsComic from '../../walls/walls-comics/entities/walls-comic.entity';
import { UpdateComicDto } from '../dto/update-comic.dto';

@Entity('comics')
export default class Comic extends Article {
  @Column({ nullable: true })
  issues: number;

  @Column({ nullable: true })
  finished: Date;

  @Column({ nullable: true })
  premiered: Date;

  @Column({ nullable: true })
  @Exclude()
  imageUrn: string;

  @Expose()
  get imageUrl(): string {
    return this.imageUrn
      ? `${process.env.APP_URL}/images/${this.imageUrn}`
      : 'https://via.placeholder.com/225x320';
  }

  @Exclude()
  @OneToMany(() => WallsComic, (wallsComic) => wallsComic.comic)
  wallsComics: Array<WallsComic>;

  @Expose()
  userWallsComic: WallsComic;

  mapDtoToEntity(updateComicDto: UpdateComicDto) {
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
    }
  }
}
