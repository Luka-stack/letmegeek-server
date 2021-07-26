import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../auth/auth.module';
import { MangasModule } from '../../mangas/mangas.module';
import { WallsMangasModule } from '../../walls/walls-mangas/walls-mangas.module';
import { MangasReviewsService } from './mangas-reviews.service';
import { MangasReviewsController } from './mangas-reviews.controller';
import { MangasReviewsRepository } from './mangas-reviews.repository';

@Module({
  imports: [
    AuthModule,
    MangasModule,
    ConfigModule,
    WallsMangasModule,
    TypeOrmModule.forFeature([MangasReviewsRepository]),
  ],
  controllers: [MangasReviewsController],
  providers: [MangasReviewsService],
})
export class MangasReviewsModule {}
