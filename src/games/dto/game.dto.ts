import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

import ArticleDto from '../../shared/dto/article.dto';

export class GameDto extends ArticleDto {
  @IsOptional()
  @IsDateString()
  premiered?: Date;

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
