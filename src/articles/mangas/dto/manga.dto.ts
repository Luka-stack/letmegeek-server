import { IsDateString, IsNumber, IsOptional } from 'class-validator';

import ArticleDto from '../../dto/article.dto';
import { MangaType } from '../entities/manga-type';
import { IsMangaType } from '../../../utils/validators/manga-type.validator';

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
