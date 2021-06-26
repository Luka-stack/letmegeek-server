import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import User from '../../../users/entities/user.entity';
import Manga from '../../../mangas/entities/manga.entity';
import Wall from '../../../walls/entities/wall.entity';
import { UpdateWallsMangaDto } from '../dto/update-walls-manga.dto';

@Entity('walls_mangas')
export default class WallsManga extends Wall {
  @Column({ nullable: true })
  volumes: number;

  @Column({ nullable: true })
  chapters: number;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  finishedAt: Date;

  @Exclude()
  @ManyToOne(() => User, (user) => user.wallsMangas, {
    nullable: false,
    eager: false,
  })
  @JoinColumn({ name: 'username', referencedColumnName: 'username' })
  user: User;

  @ManyToOne(() => Manga, { eager: true, nullable: false })
  manga: Manga;

  updateFields(updateWallsMangaDto: UpdateWallsMangaDto) {
    this.status = updateWallsMangaDto.status || this.status;
    this.volumes = updateWallsMangaDto.volumes || this.volumes;
    this.chapters = updateWallsMangaDto.chapters || this.chapters;
    this.startedAt = updateWallsMangaDto.startedAt || this.startedAt;
    this.finishedAt = updateWallsMangaDto.finishedAt || this.finishedAt;
  }
}
