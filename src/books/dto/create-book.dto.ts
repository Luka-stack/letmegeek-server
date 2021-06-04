import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBookDto {
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

  @IsNotEmpty()
  @IsString()
  publisher: string;

  @IsNotEmpty()
  premiered: Date;

  @IsNotEmpty()
  @IsBoolean()
  draft: boolean;
}
