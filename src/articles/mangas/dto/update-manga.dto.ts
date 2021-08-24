import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';

import { MangaDto } from './manga.dto';

export class UpdateMangaDto extends PartialType(MangaDto) {
  @IsOptional()
  @IsBoolean()
  accepted?: boolean;
}
