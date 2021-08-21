import { EntityRepository, Repository } from 'typeorm';

import BookStats from './entities/book-stats.viewentity';

@EntityRepository(BookStats)
export class BookStatsRepository extends Repository<BookStats> {}
