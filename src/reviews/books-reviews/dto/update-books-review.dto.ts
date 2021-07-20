import { PartialType } from '@nestjs/mapped-types';
import { BooksReviewDto } from './books-review.dto';

export class UpdateBooksReviewDto extends PartialType(BooksReviewDto) {}
