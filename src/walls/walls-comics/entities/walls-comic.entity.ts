import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import User from '../../../users/entities/user.entity';
import Wall from '../../entities/wall.entity';
import Comic from '../../../articles/comics/entities/comic.entity';
import { UpdateWallsComicDto } from '../dto/update-walls-comic.dto';

@Entity('walls_comics')
export default class WallsComic extends Wall {
  @Column({ nullable: true })
  issues: number;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  finishedAt: Date;

  @Exclude()
  @ManyToOne(() => User, (user) => user.wallsComics, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'username', referencedColumnName: 'username' })
  user: User;

  @ManyToOne(() => Comic, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  comic: Comic;

  updateFields(updateWallsComicDto: UpdateWallsComicDto) {
    this.score = updateWallsComicDto.score || this.score;
    this.status = updateWallsComicDto.status || this.status;
    this.issues = updateWallsComicDto.issues || this.issues;
    this.startedAt = updateWallsComicDto.startedAt || this.startedAt;
    this.finishedAt = updateWallsComicDto.finishedAt || this.finishedAt;
  }
}
