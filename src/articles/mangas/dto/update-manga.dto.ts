import { PartialType } from '@nestjs/mapped-types';

import { MangaDto } from './manga.dto';

export class UpdateMangaDto extends PartialType(MangaDto) {}
