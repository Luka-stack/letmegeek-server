import { Entity, JoinColumn, ManyToOne } from 'typeorm';

import Comic from '../../../articles/comics/entities/comic.entity';
import User from '../../../users/entities/user.entity';
import Review from '../../entities/review.entity';
import { UpdateComicsReviewDto } from '../dto/update-comics-review.dto';

@Entity('comics_reviews')
export default class ComicsReview extends Review {
  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'username', referencedColumnName: 'username' })
  user: User;

  @ManyToOne(() => Comic, { onDelete: 'CASCADE', eager: false })
  comic: Comic;

  updateFields(updateReview: UpdateComicsReviewDto) {
    this.art = updateReview.art || this.art;
    this.characters = updateReview.characters || this.characters;
    this.story = updateReview.story || this.story;
    this.enjoyment = updateReview.enjoyment || this.enjoyment;
    this.overall = updateReview.overall || this.overall;
    this.review = updateReview.review || this.review;
  }
}
