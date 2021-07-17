import Manga from '../entities/manga.entity';
import { PaginatedResponseDto } from 'src/shared/dto/paginated-response.dto';

export class PaginatedMangasDto extends PaginatedResponseDto {
  data: Array<Manga>;
}
