import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import { UserMiddleware } from '../../auth/middlewares/user.middleware';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { BooksRepository } from './books.repository';
import { ConfigModule } from '@nestjs/config';
import { BookStatsRepository } from './book-stats.repository';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule,
    TypeOrmModule.forFeature([BooksRepository, BookStatsRepository]),
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [TypeOrmModule],
})
export class BooksModule implements NestModule {
  configure(context: MiddlewareConsumer) {
    context.apply(UserMiddleware).forRoutes(
      {
        path: 'api/books/:identifier/:slug',
        method: RequestMethod.GET,
      },
      {
        path: 'api/books',
        method: RequestMethod.GET,
      },
    );
  }
}
