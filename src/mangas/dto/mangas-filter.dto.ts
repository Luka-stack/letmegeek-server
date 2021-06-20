import {
  IsBooleanString,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class MangasFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumberString()
  volumes?: number;

  @IsOptional()
  @IsBooleanString()
  finished?: boolean;

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
