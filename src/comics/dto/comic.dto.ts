import { IsDateString, IsNumber, IsOptional } from 'class-validator';

import ArticleDto from '../../shared/dto/article.dto';

export class ComicDto extends ArticleDto {
  @IsOptional()
  @IsNumber()
  issues?: number;

  @IsOptional()
  @IsDateString()
  finished?: Date;

  @IsOptional()
  @IsDateString()
  premiered?: Date;
}
