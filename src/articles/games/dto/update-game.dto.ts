import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';

import { GameDto } from './game.dto';

export class UpdateGameDto extends PartialType(GameDto) {
  @IsOptional()
  @IsBoolean()
  accepted?: boolean;
}
