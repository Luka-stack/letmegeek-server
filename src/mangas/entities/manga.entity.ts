import { Exclude, Expose } from 'class-transformer';
import { Column, Entity, OneToMany } from 'typeorm';

import Article from '../../shared/entities/article.entity';
import WallsManga from '../../walls/walls-mangas/entities/walls-manga.entity';
import { MangaType } from './manga-type';
import { UpdateMangaDto } from '../dto/update-manga.dto';

@Entity('mangas')
export default class Manga extends Article {
  @Column({ nullable: true })
  volumes: number;

  @Column({ nullable: true })
  chapters: number;

  @Column({ nullable: true })
  premiered: Date;

  @Column({ nullable: true })
  finished: Date;

  @Column({ nullable: true })
  type: MangaType;

  @Exclude()
  @OneToMany(() => WallsManga, (wallsManga) => wallsManga.manga, {
    eager: false,
  })
  wallsMangas: Array<WallsManga>;

  @Expose()
  userWallsManga: WallsManga;

  mapDtoToEntity(updateMangaDto: UpdateMangaDto) {
    this.title = updateMangaDto.title || this.title;
    this.premiered = updateMangaDto.premiered || this.premiered;
    this.finished = updateMangaDto.finished || this.finished;
    this.chapters = updateMangaDto.chapters || this.chapters;
    this.volumes = updateMangaDto.volumes || this.volumes;
    this.authors = updateMangaDto.authors || this.authors;
    this.description = updateMangaDto.description || this.description;
    this.publishers = updateMangaDto.publishers || this.publishers;
    this.genres = updateMangaDto.genres || this.genres;
    this.type = updateMangaDto.type || this.type;

    if (updateMangaDto.draft != null) {
      this.draft = updateMangaDto.draft;
    }
  }
}
