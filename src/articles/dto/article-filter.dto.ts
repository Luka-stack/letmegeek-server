import { IsNumberString, IsOptional, IsString, Length } from 'class-validator';

import { PaginationDto } from '../../shared/dto/pagination.dto';
import { IsArticlesStatProperty } from '../../utils/validators/article-stats-order.validator';

export class ArticleFitlerDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  genres?: string;

  @IsOptional()
  @IsString()
  authors?: string;

  @IsOptional()
  @IsString()
  publishers?: string;

  @IsOptional()
  @IsNumberString()
  @Length(4)
  premiered?: number;

  @IsOptional()
  @IsArticlesStatProperty()
  orderBy?: string;

  @IsOptional()
  @IsString()
  ordering?: string;
}
