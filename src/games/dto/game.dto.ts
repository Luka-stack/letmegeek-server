import { IsNumber, IsOptional, IsString } from 'class-validator';

import ArticleDto from '../../shared/dto/article.dto';

export class GameDto extends ArticleDto {
  @IsOptional()
  @IsNumber()
  completeTime?: number;

  @IsOptional()
  @IsString()
  gameMode?: string;

  @IsOptional()
  @IsString()
  gears?: string;
}
