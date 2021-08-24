import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';

import { ComicDto } from './comic.dto';

export class UpdateComicDto extends PartialType(ComicDto) {
  @IsOptional()
  @IsBoolean()
  accepted?: boolean;
}
