import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../auth/auth.module';
import { MangasModule } from '../../mangas/mangas.module';
import { WallsMangasService } from './walls-mangas.service';
import { WallsMangasController } from './walls-mangas.controller';
import { WallsMangasRepository } from './walls-mangas.repository';

@Module({
  imports: [
    AuthModule,
    MangasModule,
    TypeOrmModule.forFeature([WallsMangasRepository]),
  ],
  providers: [WallsMangasService],
  controllers: [WallsMangasController],
  exports: [TypeOrmModule],
})
export class WallsMangasModule {}
