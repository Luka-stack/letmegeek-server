import Article from '../../shared/entities/article.entity';
import { Column, Entity } from 'typeorm';
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

  // sequel
  // prequel One-To-One Book-Book

  /*
   * TODO
   * to be defined after creating Rating Entity
   */
  // ratings

  /*
   * TODO
   * to be defined after creating Comment Entity
   */
  // comments

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
