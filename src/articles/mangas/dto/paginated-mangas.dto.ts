import { PaginatedResponseDto } from '../../../shared/dto/paginated-response.dto';

export class PaginatedMangasDto extends PaginatedResponseDto {
  data: Array<any>;
}
