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
import { ComicsService } from './comics.service';
import { ComicsController } from './comics.controller';
import { ComicsRepository } from './comics.repository';
import { UserMiddleware } from '../auth/middlewares/user.middleware';
import { ComicStatsRepository } from './comics-stats.repository';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule,
    TypeOrmModule.forFeature([ComicsRepository, ComicStatsRepository]),
  ],
  controllers: [ComicsController],
  providers: [ComicsService],
  exports: [TypeOrmModule],
})
export class ComicsModule implements NestModule {
  configure(context: MiddlewareConsumer) {
    context.apply(UserMiddleware).forRoutes(
      {
        path: 'api/comics/:identifier/:slug',
        method: RequestMethod.GET,
      },
      {
        path: 'api/comics',
        method: RequestMethod.GET,
      },
    );
  }
}
