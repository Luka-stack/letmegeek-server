import { IsNumberString, IsOptional, IsString } from 'class-validator';

import { ArticleFitlerDto } from '../../shared/dto/article-filter.dto';

export class GamesFilterDto extends ArticleFitlerDto {
  @IsOptional()
  @IsNumberString()
  completeTime?: number;

  @IsOptional()
  @IsString()
  gameMode?: string;

  @IsOptional()
  @IsString()
  gears?: string;
}
