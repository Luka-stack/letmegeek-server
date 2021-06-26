import { IsNumber, IsOptional } from 'class-validator';

import WallDto from '../../dto/wall.dto';

export class WallsComicDto extends WallDto {
  @IsOptional()
  @IsNumber()
  issues: number;
}
