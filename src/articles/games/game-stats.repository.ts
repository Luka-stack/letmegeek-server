import { EntityRepository, Repository } from 'typeorm';

import GameStats from './entities/game-stats.viewentity';

@EntityRepository(GameStats)
export class GameStatsRepository extends Repository<GameStats> {}
