import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { BooksModule } from './books/books.module';
import { GamesModule } from './games/games.module';
import { ComicsModule } from './comics/comics.module';
import { MangasModule } from './mangas/mangas.module';
import { UsersModule } from './users/users.module';
import { WallsModule } from './walls/walls.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { configValidationSchema } from './config.schema';
import { CommentsModule } from './comments/comments.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.stage.${process.env.STAGE}`],
      validationSchema: configValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        autoLoadEntities: true,
        synchronize: true,
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
      }),
    }),
    ScheduleModule.forRoot(),
    BooksModule,
    GamesModule,
    ComicsModule,
    MangasModule,
    UsersModule,
    WallsModule,
    AuthModule,
    MailModule,
    CommentsModule,
    ReviewsModule,
  ],
})
export class AppModule {}
