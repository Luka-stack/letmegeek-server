import {
  IsBooleanString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

import { ArticleFitlerDto } from '../../dto/article-filter.dto';

export class MangasFilterDto extends ArticleFitlerDto {
  @IsOptional()
  @IsNumberString()
  volumes?: number;

  @IsOptional()
  @IsBooleanString()
  finished?: string;

  @IsOptional()
  @IsString() //TODO add validation
  type?: string;
}
