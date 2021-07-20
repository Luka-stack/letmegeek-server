import { IsNumber, IsOptional } from 'class-validator';

import ReviewDto from '../../dto/review.dto';

export class GamesReviewDto extends ReviewDto {
  @IsOptional()
  @IsNumber()
  graphics: number;

  @IsOptional()
  @IsNumber()
  music: number;

  @IsOptional()
  @IsNumber()
  voicing: number;
}
