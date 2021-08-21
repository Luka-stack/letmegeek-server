import { Connection, ViewColumn, ViewEntity } from 'typeorm';

import WallsBook from '../../../walls/walls-books/entities/walls-book.entity';

@ViewEntity({
  expression: (connection: Connection) =>
    connection
      .createQueryBuilder()
      .select('AVG(wall.score)', 'avgScore')
      .addSelect('COUNT(wall.score)', 'countScore')
      .addSelect('COUNT(wall.id)', 'members')
      .addSelect('wall.bookId', 'bookId')
      .groupBy('wall.bookId')
      .from(WallsBook, 'wall'),
})
export default class BookStats {
  @ViewColumn()
  bookId: string;

  @ViewColumn()
  avgScore: number;

  @ViewColumn()
  countScore: number;

  @ViewColumn()
  members: number;
}
