import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IsCommaSeparatedString } from '../../utils/genre-validator';

export default abstract class ArticleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsCommaSeparatedString()
  genres?: string;

  @IsOptional()
  @IsCommaSeparatedString()
  authors?: string;

  @IsOptional()
  @IsCommaSeparatedString()
  publishers?: string;

  @IsNotEmpty()
  @IsBoolean()
  draft: boolean;
}
