import { ViewEntity, Connection, ViewColumn } from 'typeorm';

import WallsGame from '../../../walls/walls-games/entities/walls-game.entity';

@ViewEntity({
  expression: (connection: Connection) =>
    connection
      .createQueryBuilder()
      .select('AVG(wall.score)', 'avgScore')
      .addSelect('COUNT(wall.score)', 'countScore')
      .addSelect('COUNT(wall.id)', 'members')
      .addSelect('wall.gameId', 'gameId')
      .groupBy('wall.gameId')
      .from(WallsGame, 'wall'),
})
export default class GameStats {
  @ViewColumn()
  gameId: string;

  @ViewColumn()
  avgScore: number;

  @ViewColumn()
  countScore: number;

  @ViewColumn()
  members: number;
}
