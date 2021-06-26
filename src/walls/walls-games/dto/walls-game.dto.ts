import { IsNumber, IsOptional } from 'class-validator';

import WallDto from '../../dto/wall.dto';

export class WallsGameDto extends WallDto {
  @IsOptional()
  @IsNumber()
  hoursPlayed: number;
}
