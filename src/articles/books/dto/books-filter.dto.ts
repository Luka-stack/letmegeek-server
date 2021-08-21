import { IsNumberString, IsOptional } from 'class-validator';

import { ArticleFitlerDto } from '../../dto/article-filter.dto';

export class BooksFilterDto extends ArticleFitlerDto {
  @IsOptional()
  @IsNumberString()
  pages?: number;
}
