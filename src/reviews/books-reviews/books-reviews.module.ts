import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../auth/auth.module';
import { BooksModule } from '../../articles/books/books.module';
import { WallsBooksModule } from '../../walls/walls-books/walls-books.module';
import { BooksReviewsController } from './books-reviews.controller';
import { BooksReviewsRepository } from './books-reviews.repository';
import { BooksReviewsService } from './books-reviews.service';

@Module({
  imports: [
    AuthModule,
    BooksModule,
    WallsBooksModule,
    ConfigModule,
    TypeOrmModule.forFeature([BooksReviewsRepository]),
  ],
  providers: [BooksReviewsService],
  controllers: [BooksReviewsController],
})
export class BooksReviewsModule {}
