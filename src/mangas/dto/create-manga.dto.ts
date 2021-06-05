import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsGenreString } from 'src/utils/genre-validator';

export class CreateMangaDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  series?: string;

  @IsNotEmpty()
  @IsString()
  author: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsGenreString()
  genres: string;

  @IsNotEmpty()
  @IsString()
  publisher: string;

  @IsNotEmpty()
  premiered: Date;

  @IsNotEmpty()
  draft: boolean;
}
