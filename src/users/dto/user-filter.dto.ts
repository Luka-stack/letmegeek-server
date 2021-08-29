import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../shared/dto/pagination.dto';

export class UserFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  ordering: string;

  @IsOptional()
  @IsBooleanString()
  isBlocked: string;
}
