import { PartialType } from '@nestjs/mapped-types';

import { GameDto } from './game.dto';

export class UpdateGameDto extends PartialType(GameDto) {}
