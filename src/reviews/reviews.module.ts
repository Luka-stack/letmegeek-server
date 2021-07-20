import { Module } from '@nestjs/common';

import { BooksReviewsModule } from './books-reviews/books-reviews.module';
import { ComicsReviewsModule } from './comics-reviews/comics-reviews.module';
import { MangasReviewsModule } from './mangas-reviews/mangas-reviews.module';
import { GamesReviewsModule } from './games-reviews/games-reviews.module';

@Module({
  imports: [
    BooksReviewsModule,
    ComicsReviewsModule,
    MangasReviewsModule,
    GamesReviewsModule,
  ],
})
export class ReviewsModule {}
