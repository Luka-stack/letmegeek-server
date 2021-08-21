import { EntityRepository, Repository } from 'typeorm';

import ComicStats from './entities/comic-stats.viewentity';

@EntityRepository(ComicStats)
export class ComicStatsRepository extends Repository<ComicStats> {}
