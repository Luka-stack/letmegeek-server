import { PartialType } from '@nestjs/mapped-types';

import { WallsBookDto } from './walls-book.dto';

export class UpdateWallsBookDto extends PartialType(WallsBookDto) {}
