import ComicsReview from '../entities/comics-review.entity';
import { PaginatedResponseDto } from '../../../shared/dto/paginated-response.dto';

export class PaginatedComicsReviewsDto extends PaginatedResponseDto {
  data: Array<ComicsReview>;
}
