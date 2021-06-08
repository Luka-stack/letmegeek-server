import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IsGenreString } from '../../utils/genre-validator';

export default abstract class ArticleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsGenreString()
  genres?: string;

  @IsOptional()
  @IsString()
  authors?: string;

  @IsOptional()
  @IsString()
  publishers?: string;

  @IsNotEmpty()
  @IsBoolean()
  draft: boolean;
}
