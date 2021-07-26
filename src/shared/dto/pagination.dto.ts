import { IsNotEmpty, IsNumberString } from 'class-validator';

export class PaginationDto {
  @IsNotEmpty()
  @IsNumberString()
  page: number;

  @IsNotEmpty()
  @IsNumberString()
  limit: number;
}
