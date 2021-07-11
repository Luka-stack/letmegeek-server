import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import User from '../../users/entities/user.entity';
import WallsManga from './entities/walls-manga.entity';
import { WallsMangaDto } from './dto/walls-manga.dto';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { WallsMangasService } from './walls-mangas.service';
import { UpdateWallsMangaDto } from './dto/update-walls-manga.dto';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('api/wallsmangas')
export class WallsMangasController {
  constructor(private readonly wallsMangasService: WallsMangasService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/manga/:mangaIdentifier')
  createRecord(
    @Param('mangaIdentifier') mangaIdentifier: string,
    @Body() wallsMangaDto: WallsMangaDto,
    @GetUser() user: User,
  ): Promise<WallsManga> {
    return this.wallsMangasService.createRecord(
      mangaIdentifier,
      wallsMangaDto,
      user,
    );
  }

  @Get('/:username')
  getRecordsByUser(
    @Param('username') username: string,
    @Query() filterDto: WallsFilterDto,
  ): Promise<Array<WallsManga>> {
    return this.wallsMangasService.getRecordsByUser(username, filterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/manga/:mangaIdentifier')
  updateRecord(
    @Param('mangaIdentifier') identifier: string,
    @Body() updateWallsMangaDto: UpdateWallsMangaDto,
    @GetUser() user: User,
  ): Promise<WallsManga> {
    return this.wallsMangasService.updateRecord(
      identifier,
      updateWallsMangaDto,
      user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/manga/:mangaIdentifier')
  @HttpCode(204)
  deleteRecord(
    @Param('mangaIdentifier') identifier: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.wallsMangasService.deleteRecord(identifier, user);
  }
}
