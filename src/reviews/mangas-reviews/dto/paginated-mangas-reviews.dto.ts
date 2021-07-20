import MangasReview from '../entities/mangas-review.entity';
import { PaginatedResponseDto } from '../../../shared/dto/paginated-response.dto';

export class PaginatedMangasReviewsDto extends PaginatedResponseDto {
  data: Array<MangasReview>;
}
