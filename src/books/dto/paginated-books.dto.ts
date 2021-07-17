import Book from '../entities/book.entity';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';

export class PaginatedBooksDto extends PaginatedResponseDto {
  data: Array<Book>;
}
