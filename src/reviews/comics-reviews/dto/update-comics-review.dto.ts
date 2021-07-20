import { PartialType } from '@nestjs/mapped-types';
import { ComicsReviewDto } from './comics-review.dto';

export class UpdateComicsReviewDto extends PartialType(ComicsReviewDto) {}
