import { IsNumberString, IsOptional, Max, Min } from 'class-validator';

import { IsArticleName } from '../../utils/validators/article-name.validator';

export class UserDetailsFilterDto {
  @IsOptional()
  @IsArticleName()
  article: string;

  @IsOptional()
  @IsNumberString()
  @Max(5)
  lastUpdates: string;

  @IsOptional()
  @IsNumberString()
  lastComments: string;

  @IsOptional()
  @IsNumberString()
  lastReviews: string;
}
