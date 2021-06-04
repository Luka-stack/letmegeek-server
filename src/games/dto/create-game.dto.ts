import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGameDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  studio: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  publisher: string;

  @IsNotEmpty()
  premiered: Date;

  @IsNotEmpty()
  @IsBoolean()
  draft: boolean;
}
