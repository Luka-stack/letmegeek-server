import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../auth/auth.module';
import { BooksModule } from '../../books/books.module';
import { BooksReviewsController } from './books-reviews.controller';
import { BooksReviewsRepository } from './books-reviews.repository';
import { BooksReviewsService } from './books-reviews.service';

@Module({
  imports: [
    AuthModule,
    BooksModule,
    TypeOrmModule.forFeature([BooksReviewsRepository]),
  ],
  providers: [BooksReviewsService],
  controllers: [BooksReviewsController],
})
export class BooksReviewsModule {}
