import { PartialType } from '@nestjs/mapped-types';

import { WallsGameDto } from './walls-game.dto';

export class UpdateWallsGameDto extends PartialType(WallsGameDto) {}
