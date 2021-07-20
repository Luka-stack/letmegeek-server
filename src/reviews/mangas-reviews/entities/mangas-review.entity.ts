import { Entity, JoinColumn, ManyToOne } from 'typeorm';

import User from '../../../users/entities/user.entity';
import Manga from '../../..//mangas/entities/manga.entity';
import Review from '../../entities/review.entity';
import { UpdateMangasReviewDto } from '../dto/update-mangas-review.dto';

@Entity('mangas_reviews')
export default class MangasReview extends Review {
  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'username', referencedColumnName: 'username' })
  user: User;

  @ManyToOne(() => Manga, { onDelete: 'CASCADE', eager: false })
  manga: Manga;

  updateFields(updateReview: UpdateMangasReviewDto) {
    this.art = updateReview.art || this.art;
    this.characters = updateReview.characters || this.characters;
    this.story = updateReview.story || this.story;
    this.enjoyment = updateReview.enjoyment || this.enjoyment;
    this.overall = updateReview.overall || this.overall;
    this.review = updateReview.review || this.review;
  }
}
