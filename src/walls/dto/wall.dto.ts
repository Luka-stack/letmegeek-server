import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { WallArticleStatus } from '../entities/wall-article-status';

export default abstract class WallDto {
  @IsNotEmpty()
  @IsString()
  status: WallArticleStatus;

  @IsOptional()
  @IsNumber()
  score: number;

  @IsOptional()
  @IsDateString()
  startedAt: Date;

  @IsOptional()
  @IsDateString()
  finishedAt: Date;
}
