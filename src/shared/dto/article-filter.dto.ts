import { IsNumberString, IsOptional, IsString, Length } from 'class-validator';

export class ArticleFitlerDto {
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
  @Length(4)
  premiered?: number;
}
