import { PartialType } from '@nestjs/mapped-types';

import { MangasReviewDto } from './mangas-review.dto';

export class UpdateMangasReviewDto extends PartialType(MangasReviewDto) {}
