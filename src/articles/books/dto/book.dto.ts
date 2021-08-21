import { IsNumber, IsOptional, IsString } from 'class-validator';

import ArticleDto from '../../../shared/dto/article.dto';

export class BookDto extends ArticleDto {
  @IsOptional()
  @IsString()
  series?: string;

  @IsOptional()
  @IsNumber()
  pages?: number;
}
