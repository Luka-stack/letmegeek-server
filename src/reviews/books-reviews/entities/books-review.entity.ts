import { Entity, JoinColumn, ManyToOne } from 'typeorm';

import Book from '../../../articles/books/entities/book.entity';
import User from '../../../users/entities/user.entity';
import Review from '../../entities/review.entity';
import { UpdateBooksReviewDto } from '../dto/update-books-review.dto';

@Entity('books_reviews')
export default class BooksReview extends Review {
  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'username', referencedColumnName: 'username' })
  user: User;

  @ManyToOne(() => Book, { onDelete: 'CASCADE', eager: false })
  book: Book;

  updateFields(updateReview: UpdateBooksReviewDto) {
    this.art = updateReview.art || this.art;
    this.characters = updateReview.characters || this.characters;
    this.story = updateReview.story || this.story;
    this.enjoyment = updateReview.enjoyment || this.enjoyment;
    this.overall = updateReview.overall || this.overall;
    this.review = updateReview.review || this.review;
  }
}
