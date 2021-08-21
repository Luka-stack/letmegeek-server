import { ViewEntity, Connection, ViewColumn } from 'typeorm';

import WallsManga from '../../../walls/walls-mangas/entities/walls-manga.entity';

@ViewEntity({
  expression: (connection: Connection) =>
    connection
      .createQueryBuilder()
      .select('AVG(wall.score)', 'avgScore')
      .addSelect('COUNT(wall.score)', 'countScore')
      .addSelect('COUNT(wall.id)', 'members')
      .addSelect('wall.mangaId', 'mangaId')
      .groupBy('wall.mangaId')
      .from(WallsManga, 'wall'),
})
export default class MangaStats {
  @ViewColumn()
  mangaId: string;

  @ViewColumn()
  avgScore: number;

  @ViewColumn()
  countScore: number;

  @ViewColumn()
  members: number;
}
