import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import Wall from '../../entities/wall.entity';
import Game from '../../../articles/games/entities/game.entity';
import User from '../../../users/entities/user.entity';
import { UpdateWallsGameDto } from '../dto/update-walls-game.dto';

@Entity('walls_games')
export default class WallsGame extends Wall {
  @Column({ nullable: true })
  hoursPlayed: number;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  finishedAt: Date;

  @Exclude()
  @ManyToOne(() => User, (user) => user.wallsGames, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'username', referencedColumnName: 'username' })
  user: User;

  @ManyToOne(() => Game, { eager: false, nullable: false, onDelete: 'CASCADE' })
  game: Game;

  updateFields(updateWallsGameDto: UpdateWallsGameDto) {
    this.score = updateWallsGameDto.score || this.score;
    this.status = updateWallsGameDto.status || this.status;
    this.startedAt = updateWallsGameDto.startedAt || this.startedAt;
    this.finishedAt = updateWallsGameDto.finishedAt || this.finishedAt;
    this.hoursPlayed = updateWallsGameDto.hoursPlayed || this.hoursPlayed;
  }
}
