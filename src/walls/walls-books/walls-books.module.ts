import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BooksModule } from '../../books/books.module';
import { UsersModule } from '../../users/users.module';
import { WallsBooksService } from './walls-books.service';
import { WallsBooksController } from './walls-books.controller';
import { WallsBooksRepository } from './walls-books.repository';

@Module({
  imports: [
    UsersModule,
    BooksModule,
    TypeOrmModule.forFeature([WallsBooksRepository]),
  ],
  providers: [WallsBooksService],
  controllers: [WallsBooksController],
})
export class WallsBooksModule {}
