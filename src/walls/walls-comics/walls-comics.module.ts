import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../auth/auth.module';
import { ComicsModule } from '../../comics/comics.module';
import { WallsComicsService } from './walls-comics.service';
import { WallsComicsController } from './walls-comics.controller';
import { WallsComicsRepository } from './walls-comics.repository';

@Module({
  imports: [
    AuthModule,
    ComicsModule,
    TypeOrmModule.forFeature([WallsComicsRepository]),
  ],
  providers: [WallsComicsService],
  controllers: [WallsComicsController],
})
export class WallsComicsModule {}
