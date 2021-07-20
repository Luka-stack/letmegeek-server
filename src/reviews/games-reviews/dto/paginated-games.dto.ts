import GamesReview from '../entities/games-review.entity';
import { PaginatedResponseDto } from '../../../shared/dto/paginated-response.dto';

export class PaginatedGamesReviewsDto extends PaginatedResponseDto {
  data: Array<GamesReview>;
}
