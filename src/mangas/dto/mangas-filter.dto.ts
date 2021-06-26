import {
  IsBooleanString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

import { ArticleFitlerDto } from '../../shared/dto/article-filter.dto';

export class MangasFilterDto extends ArticleFitlerDto {
  @IsOptional()
  @IsNumberString()
  volumes?: number;

  @IsOptional()
  @IsBooleanString()
  finished?: boolean;

  @IsOptional()
  @IsString()
  type?: string;
}
