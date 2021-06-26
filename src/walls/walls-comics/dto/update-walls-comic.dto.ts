import { PartialType } from '@nestjs/mapped-types';

import { WallsComicDto } from './walls-comic.dto';

export class UpdateWallsComicDto extends PartialType(WallsComicDto) {}
