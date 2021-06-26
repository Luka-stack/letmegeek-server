import {
  Body,
  Param,
  Post,
  Get,
  Patch,
  Delete,
  HttpCode,
  Query,
} from '@nestjs/common';
import { Controller } from '@nestjs/common';

import WallsBook from './entities/walls-book.entity';
import { WallsBookDto } from './dto/walls-book.dto';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { WallsBooksService } from './walls-books.service';
import { UpdateWallsBookDto } from './dto/update-walls-book.dto';

@Controller('api/wallsbooks')
export class WallsBooksController {
  constructor(private readonly wallsBooksService: WallsBooksService) {}

  @Post('/:username/book/:bookIdentifier')
  createRecord(
    @Param('username') username: string,
    @Param('bookIdentifier') bookIdentifier: string,
    @Body() wallsBookDto: WallsBookDto,
  ): Promise<WallsBook> {
    return this.wallsBooksService.createRecord(
      username,
      bookIdentifier,
      wallsBookDto,
    );
  }

  @Get('/:username')
  getRecordsByUser(
    @Param('username') username: string,
    @Query() filterDto: WallsFilterDto,
  ): Promise<Array<WallsBook>> {
    return this.wallsBooksService.getRecordsByUser(username, filterDto);
  }

  @Patch('/:username/book/:identifier')
  updateRecord(
    @Param('username') username: string,
    @Param('identifier') identifier: string,
    @Body() updateWallsBookDto: UpdateWallsBookDto,
  ): Promise<WallsBook> {
    return this.wallsBooksService.updateRecord(
      username,
      identifier,
      updateWallsBookDto,
    );
  }

  @Delete('/:username/book/:identifier')
  @HttpCode(204)
  deleteRecord(
    @Param('username') username: string,
    @Param('identifier') identifier: string,
  ): Promise<void> {
    return this.wallsBooksService.deleteRecord(username, identifier);
  }
}
