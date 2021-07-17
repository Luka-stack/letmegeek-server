import Comic from '../entities/comic.entity';
import { PaginatedResponseDto } from 'src/shared/dto/paginated-response.dto';

export class PaginatedComicsDto extends PaginatedResponseDto {
  data: Array<Comic>;
}
