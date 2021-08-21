import { IsDateString, IsNumber, IsOptional } from 'class-validator';
import { IsMangaType } from 'src/utils/validators/manga-type.validator';

import ArticleDto from '../../dto/article.dto';
import { MangaType } from '../entities/manga-type';

export class MangaDto extends ArticleDto {
  @IsOptional()
  @IsNumber()
  volumes?: number;

  @IsOptional()
  @IsNumber()
  chapters?: number;

  @IsOptional()
  @IsDateString()
  finished?: Date;

  @IsOptional()
  @IsMangaType()
  type: MangaType;
}
