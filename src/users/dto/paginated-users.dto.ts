import User from '../entities/user.entity';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';

export class PaginatedUsersDto extends PaginatedResponseDto {
  data: Array<User>;
}
