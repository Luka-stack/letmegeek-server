import { Module } from '@nestjs/common';
import { WallsMangasService } from './walls-mangas.service';
import { WallsMangasController } from './walls-mangas.controller';
import { UsersModule } from 'src/users/users.module';
import { MangasModule } from 'src/mangas/mangas.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WallsMangasRepository } from './walls-mangas.repository';

@Module({
  imports: [
    UsersModule,
    MangasModule,
    TypeOrmModule.forFeature([WallsMangasRepository]),
  ],
  providers: [WallsMangasService],
  controllers: [WallsMangasController],
})
export class WallsMangasModule {}
