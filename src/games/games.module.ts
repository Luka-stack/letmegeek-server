import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GamesService } from './games.service';
import { GamesRepository } from './games.repository';
import { GamesController } from './games.controller';
import { UserMiddleware } from '../auth/middlewares/user.middleware';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule,
    TypeOrmModule.forFeature([GamesRepository]),
  ],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [TypeOrmModule],
})
export class GamesModule implements NestModule {
  configure(context: MiddlewareConsumer) {
    context.apply(UserMiddleware).forRoutes(
      {
        path: 'api/games/:identifier/:slug',
        method: RequestMethod.GET,
      },
      {
        path: 'api/games',
        method: RequestMethod.GET,
      },
    );
  }
}
