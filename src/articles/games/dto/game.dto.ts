import { IsNumber, IsOptional, IsString } from 'class-validator';

import ArticleDto from '../../../shared/dto/article.dto';
import { IsCommaSeparatedGameMode } from '../../../utils/validators/game-mode.validator';

export class GameDto extends ArticleDto {
  @IsOptional()
  @IsNumber()
  completeTime?: number;

  @IsOptional()
  @IsCommaSeparatedGameMode()
  gameMode?: string;

  @IsOptional()
  @IsString()
  gears?: string;
}
