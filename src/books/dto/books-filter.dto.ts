import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class BooksFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  genres?: string;

  @IsOptional()
  @IsString()
  authors?: string;

  @IsOptional()
  @IsString()
  publishers?: string;

  @IsOptional()
  @IsNumberString()
  pages?: number;
}
