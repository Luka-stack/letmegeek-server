import { IsBooleanString, IsNumberString, IsOptional } from 'class-validator';

import { ArticleFitlerDto } from '../../shared/dto/article-filter.dto';

export class ComicsFilterDto extends ArticleFitlerDto {
  @IsOptional()
  @IsNumberString()
  issues?: number;

  @IsOptional()
  @IsBooleanString()
  finished?: string;
}
