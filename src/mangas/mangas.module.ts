import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MangasController } from './mangas.controller';
import { MangasRepository } from './mangas.repository';
import { MangasService } from './mangas.service';

@Module({
  imports: [TypeOrmModule.forFeature([MangasRepository])],
  controllers: [MangasController],
  providers: [MangasService],
  exports: [TypeOrmModule],
})
export class MangasModule {}
