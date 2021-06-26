import { PartialType } from '@nestjs/mapped-types';

import { WallsMangaDto } from './walls-manga.dto';

export class UpdateWallsMangaDto extends PartialType(WallsMangaDto) {}
