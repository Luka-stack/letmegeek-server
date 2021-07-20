import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../auth/auth.module';
import { ComicsModule } from '../../comics/comics.module';
import { ComicsReviewsService } from './comics-reviews.service';
import { ComicsReviewsController } from './comics-reviews.controller';
import { ComicsReviewsRepository } from './comics-reviews.repository';

@Module({
  imports: [
    AuthModule,
    ComicsModule,
    TypeOrmModule.forFeature([ComicsReviewsRepository]),
  ],
  controllers: [ComicsReviewsController],
  providers: [ComicsReviewsService],
})
export class ComicsReviewsModule {}
