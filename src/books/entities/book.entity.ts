import { Exclude, Expose } from 'class-transformer';
import { Column, Entity, OneToMany } from 'typeorm';

import Article from '../../shared/entities/article.entity';
import WallsBook from '../../walls/walls-books/entities/walls-book.entity';
import { UpdateBookDto } from '../dto/update-book.dto';

@Entity('books')
export default class Book extends Article {
  @Column({ nullable: true })
  series: string;

  @Column({ nullable: true })
  premiered: Date;

  @Column({ nullable: true })
  pages: number;

  @Column({ nullable: true })
  volume: number;

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
  @OneToMany(() => WallsBook, (wallsBook) => wallsBook.book, {
    eager: true,
  })
  wallsBooks: Array<WallsBook>;

  @Expose()
  userWallsBook: WallsBook;

  updateFields(updateBookDto: UpdateBookDto) {
    this.title = updateBookDto.title || this.title;
    this.series = updateBookDto.series || this.series;
    this.description = updateBookDto.description || this.description;
    this.premiered = updateBookDto.premiered || this.premiered;
    this.pages = updateBookDto.pages || this.pages;
    this.genres = updateBookDto.genres || this.genres;
    this.authors = updateBookDto.authors || this.authors;
    this.publishers = updateBookDto.publishers || this.publishers;

    if (updateBookDto.draft != null) {
      this.draft = updateBookDto.draft;
    }
  }
}
