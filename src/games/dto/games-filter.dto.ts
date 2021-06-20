import { IsNumberString, IsOptional } from 'class-validator';

import { IsCommaSeparatedString } from '../../utils/genre-validator';
import { ArticleFitlerDto } from '../../shared/dto/article-filter.dto';

export class GamesFilterDto extends ArticleFitlerDto {
  @IsOptional()
  @IsNumberString()
  completeTime?: number;

  @IsOptional()
  @IsCommaSeparatedString()
  gameMode?: boolean;

  @IsOptional()
  @IsCommaSeparatedString()
  gears?: string;
}
