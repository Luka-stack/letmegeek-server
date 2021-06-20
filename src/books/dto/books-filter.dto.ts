import { IsNumberString, IsOptional } from 'class-validator';

import { ArticleFitlerDto } from '../../shared/dto/article-filter.dto';

export class BooksFilterDto extends ArticleFitlerDto {
  @IsOptional()
  @IsNumberString()
  pages?: number;
}
