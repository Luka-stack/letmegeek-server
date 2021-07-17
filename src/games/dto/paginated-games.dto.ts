import Game from '../entities/game.entity';
import { PaginatedResponseDto } from 'src/shared/dto/paginated-response.dto';

export class PaginatedGamesDto extends PaginatedResponseDto {
  data: Array<Game>;
}
