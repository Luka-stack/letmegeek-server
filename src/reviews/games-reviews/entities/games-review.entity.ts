import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import Game from '../../../articles/games/entities/game.entity';
import User from '../../../users/entities/user.entity';
import Review from '../../entities/review.entity';
import { UpdateGamesReviewDto } from '../dto/update-games-review.dto';

@Entity('games_reviews')
export default class GamesReview extends Review {
  @Column({ nullable: true })
  graphics: number;

  @Column({ nullable: true })
  music: number;

  @Column({ nullable: true })
  voicing: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'username', referencedColumnName: 'username' })
  user: User;

  @ManyToOne(() => Game, { onDelete: 'CASCADE', eager: false })
  game: Game;

  updateFields(updateReview: UpdateGamesReviewDto) {
    this.graphics = updateReview.graphics || this.graphics;
    this.music = updateReview.music || this.music;
    this.voicing = updateReview.voicing || this.voicing;

    this.art = updateReview.art || this.art;
    this.characters = updateReview.characters || this.characters;
    this.story = updateReview.story || this.story;
    this.enjoyment = updateReview.enjoyment || this.enjoyment;
    this.overall = updateReview.overall || this.overall;
    this.review = updateReview.review || this.review;
  }
}
