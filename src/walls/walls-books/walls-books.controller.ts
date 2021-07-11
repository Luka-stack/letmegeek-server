import {
  Body,
  Param,
  Post,
  Get,
  Patch,
  Delete,
  HttpCode,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Controller } from '@nestjs/common';

import User from '../../users/entities/user.entity';
import WallsBook from './entities/walls-book.entity';
import { WallsBookDto } from './dto/walls-book.dto';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { WallsBooksService } from './walls-books.service';
import { UpdateWallsBookDto } from './dto/update-walls-book.dto';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('api/wallsbooks')
export class WallsBooksController {
  constructor(private readonly wallsBooksService: WallsBooksService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/book/:bookIdentifier')
  createRecord(
    @Param('bookIdentifier') bookIdentifier: string,
    @Body() wallsBookDto: WallsBookDto,
    @GetUser() user: User,
  ): Promise<WallsBook> {
    return this.wallsBooksService.createRecord(
      bookIdentifier,
      wallsBookDto,
      user,
    );
  }

  @Get('/:username')
  getRecordsByUser(
    @Param('username') username: string,
    @Query() filterDto: WallsFilterDto,
  ): Promise<Array<WallsBook>> {
    return this.wallsBooksService.getRecordsByUser(username, filterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/book/:identifier')
  updateRecord(
    @Param('identifier') identifier: string,
    @Body() updateWallsBookDto: UpdateWallsBookDto,
    @GetUser() user: User,
  ): Promise<WallsBook> {
    return this.wallsBooksService.updateRecord(
      identifier,
      updateWallsBookDto,
      user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/book/:identifier')
  @HttpCode(204)
  deleteRecord(
    @Param('identifier') identifier: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.wallsBooksService.deleteRecord(identifier, user);
  }
}
