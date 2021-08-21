import { PartialType } from '@nestjs/mapped-types';

import { ComicDto } from './comic.dto';

export class UpdateComicDto extends PartialType(ComicDto) {}
