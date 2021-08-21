import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../auth/auth.module';
import { ComicsModule } from '../../articles/comics/comics.module';
import { WallsComicsModule } from '../../walls/walls-comics/walls-comics.module';
import { ComicsReviewsService } from './comics-reviews.service';
import { ComicsReviewsController } from './comics-reviews.controller';
import { ComicsReviewsRepository } from './comics-reviews.repository';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    ComicsModule,
    ConfigModule,
    WallsComicsModule,
    TypeOrmModule.forFeature([ComicsReviewsRepository]),
  ],
  controllers: [ComicsReviewsController],
  providers: [ComicsReviewsService],
})
export class ComicsReviewsModule {}
