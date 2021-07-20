import { PartialType } from '@nestjs/mapped-types';

import { GamesReviewDto } from './games-review.dto';

export class UpdateGamesReviewDto extends PartialType(GamesReviewDto) {}
