import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MangasService } from './mangas.service';
import { MangasController } from './mangas.controller';
import { MangasRepository } from './mangas.repository';
import { UserMiddleware } from 'src/auth/middlewares/user.middleware';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule,
    TypeOrmModule.forFeature([MangasRepository]),
  ],
  controllers: [MangasController],
  providers: [MangasService],
  exports: [TypeOrmModule],
})
export class MangasModule implements NestModule {
  configure(context: MiddlewareConsumer) {
    context.apply(UserMiddleware).forRoutes(
      {
        path: 'api/mangas/:identifier/:slug',
        method: RequestMethod.GET,
      },
      {
        path: 'api/mangas',
        method: RequestMethod.GET,
      },
    );
  }
}
