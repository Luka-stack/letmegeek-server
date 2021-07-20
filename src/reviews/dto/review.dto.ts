import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export default abstract class ReviewDto {
  @IsNotEmpty()
  @IsString()
  review: string;

  @IsNotEmpty()
  @IsNumber()
  overall: number;

  @IsOptional()
  @IsNumber()
  art: number;

  @IsOptional()
  @IsNumber()
  characters: number;

  @IsOptional()
  @IsNumber()
  story: number;

  @IsOptional()
  @IsNumber()
  enjoyment: number;
}
