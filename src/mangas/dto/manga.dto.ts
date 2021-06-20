import { IsDateString, IsNumber, IsOptional } from 'class-validator';

import ArticleDto from '../../shared/dto/article.dto';

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
  @IsDateString()
  premiered?: Date;
}
