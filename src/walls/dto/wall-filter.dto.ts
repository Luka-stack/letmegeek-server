import { IsOptional, IsString } from 'class-validator';

export class WallsFilterDto {
  @IsOptional()
  @IsString()
  status?: string;
}
