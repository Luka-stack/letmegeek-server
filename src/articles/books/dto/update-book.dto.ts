import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { BookDto } from './book.dto';

export class UpdateBookDto extends PartialType(BookDto) {
  @IsOptional()
  @IsBoolean()
  accepted: boolean;
}
