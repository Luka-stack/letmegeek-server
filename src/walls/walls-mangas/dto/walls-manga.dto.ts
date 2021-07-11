import { IsNumber, IsOptional } from 'class-validator';

import WallDto from '../../dto/wall.dto';

export class WallsMangaDto extends WallDto {
  @IsOptional()
  @IsNumber()
  volumes: number;

  @IsOptional()
  @IsNumber()
  chapters: number;
}
