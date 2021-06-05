import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ComicsController } from './comics.controller';
import { ComicsRepository } from './comics.repository';
import { ComicsService } from './comics.service';

@Module({
  imports: [TypeOrmModule.forFeature([ComicsRepository])],
  controllers: [ComicsController],
  providers: [ComicsService],
})
export class ComicsModule {}
