import { EntityRepository, Repository } from 'typeorm';
import MangaStats from './entities/manga-stats.viewentity';

@EntityRepository(MangaStats)
export class MangaStatsRepository extends Repository<MangaStats> {}
