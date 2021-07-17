import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import Comment from '../entities/comment.entity';

export class PaginatedCommentsDto extends PaginatedResponseDto {
  data: Array<Comment>;
}
