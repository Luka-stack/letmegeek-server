import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';

export class PaginatedComicsDto extends PaginatedResponseDto {
  data: Array<any>;
}
