import { ViewEntity, Connection, ViewColumn } from 'typeorm';

import WallsComic from '../../../walls/walls-comics/entities/walls-comic.entity';

@ViewEntity({
  expression: (connection: Connection) =>
    connection
      .createQueryBuilder()
      .select('AVG(wall.score)', 'avgScore')
      .addSelect('COUNT(wall.score)', 'countScore')
      .addSelect('COUNT(wall.id)', 'members')
      .addSelect('wall.comicId', 'comicId')
      .groupBy('wall.comicId')
      .from(WallsComic, 'wall'),
})
export default class ComicStats {
  @ViewColumn()
  comicId: string;

  @ViewColumn()
  avgScore: number;

  @ViewColumn()
  countScore: number;

  @ViewColumn()
  members: number;
}
