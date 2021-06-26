import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { IsCommaSeparatedString } from '../../utils/validators/comma-separated-string.validator';

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

  @IsOptional()
  @IsDateString()
  premiered?: Date;

  @IsNotEmpty()
  @IsBoolean()
  draft: boolean;
}
