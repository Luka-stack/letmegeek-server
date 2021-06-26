import { IsNumber, IsOptional } from 'class-validator';

import WallDto from '../../dto/wall.dto';

export class WallsBookDto extends WallDto {
  @IsOptional()
  @IsNumber()
  pages: number;
}
