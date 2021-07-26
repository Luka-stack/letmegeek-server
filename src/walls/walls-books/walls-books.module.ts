import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../auth/auth.module';
import { BooksModule } from '../../books/books.module';
import { WallsBooksService } from './walls-books.service';
import { WallsBooksController } from './walls-books.controller';
import { WallsBooksRepository } from './walls-books.repository';

@Module({
  imports: [
    AuthModule,
    BooksModule,
    TypeOrmModule.forFeature([WallsBooksRepository]),
  ],
  providers: [WallsBooksService],
  controllers: [WallsBooksController],
  exports: [TypeOrmModule],
})
export class WallsBooksModule {}
