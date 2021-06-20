import { IsNumberString, IsOptional, IsString, Length } from 'class-validator';

import { IsCommaSeparatedString } from '../../utils/genre-validator';

export class GamesFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumberString()
  completeTime?: number;

  @IsOptional()
  @IsCommaSeparatedString()
  gameMode?: boolean;

  @IsOptional()
  @IsCommaSeparatedString()
  gears?: string;

  @IsOptional()
  @IsCommaSeparatedString()
  genres?: string;

  @IsOptional()
  @IsCommaSeparatedString()
  authors?: string;

  @IsOptional()
  @IsCommaSeparatedString()
  publishers?: string;

  @IsOptional()
  @IsNumberString()
  @Length(4)
  premiered?: number;
}
