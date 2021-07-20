import BooksReview from '../entities/books-review.entity';
import { PaginatedResponseDto } from '../../../shared/dto/paginated-response.dto';

export class PaginatedBooksReviewsDto extends PaginatedResponseDto {
  data: Array<BooksReview>;
}
