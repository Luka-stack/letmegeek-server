import { IsNumberString, IsOptional, Max } from 'class-validator';

import { IsArticleName } from '../../utils/validators/article-name.validator';

export class UserStatsFilterDto {
  @IsArticleName()
  article: string;

  @IsOptional()
  @IsNumberString()
  lastUpdates: string;
}
