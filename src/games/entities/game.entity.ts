import { Column, Entity } from 'typeorm';

import Article from '../../shared/entities/article.entity';
import { UpdateGameDto } from '../dto/update-game.dto';

@Entity('games')
export default class Game extends Article {
  @Column({ nullable: true })
  premiered: Date;

  @Column({ nullable: true })
  completeTime: number;

  @Column({ nullable: true })
  gameMode: string;

  @Column({ nullable: true })
  gears: string;

  mapDtoToEntity(updateGameDto: UpdateGameDto) {
    this.title = updateGameDto.title || this.title;
    this.premiered = updateGameDto.premiered || this.premiered;
    this.completeTime = updateGameDto.completeTime || this.completeTime;
    this.gameMode = updateGameDto.gameMode || this.gameMode;
    this.gears = updateGameDto.gears || this.gears;
    this.authors = updateGameDto.authors || this.authors;
    this.description = updateGameDto.description || this.description;
    this.publishers = updateGameDto.publishers || this.publishers;
    this.genres = updateGameDto.genres || this.genres;

    if (updateGameDto.draft != null) {
      this.draft = updateGameDto.draft;
    }
  }
}
