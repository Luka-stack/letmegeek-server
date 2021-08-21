import { PaginatedResponseDto } from '../../../shared/dto/paginated-response.dto';

export class PaginatedGamesDto extends PaginatedResponseDto {
  data: Array<any>;
}
