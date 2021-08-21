import { Exclude, Expose } from 'class-transformer';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserRole } from '../../auth/entities/user-role';
import WallsGame from '../../walls/walls-games/entities/walls-game.entity';
import WallsBook from '../../walls/walls-books/entities/walls-book.entity';
import WallsComic from '../../walls/walls-comics/entities/walls-comic.entity';
import WallsManga from '../../walls/walls-mangas/entities/walls-manga.entity';
import { UserStatsDto } from '../dto/user-stats.dto';

@Entity('users')
export default class User {
  @PrimaryGeneratedColumn('uuid')
  @Exclude()
  id: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Index({ unique: true })
  @Column()
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  @Exclude()
  imageUrn: string;

  @Column({ nullable: true })
  contributionPoints: number;

  @Expose()
  statistics: Array<UserStatsDto>;

  @Expose()
  get imageUrl(): string {
    return this.imageUrn
      ? `${process.env.APP_URL}/profileImages/${this.imageUrn}`
      : 'https://via.placeholder.com/225x188';
  }

  @Exclude()
  @OneToMany(() => WallsBook, (wallsBook) => wallsBook.user, { eager: false })
  wallsBooks: Array<WallsBook>;

  @Exclude()
  @OneToMany(() => WallsComic, (wallsComic) => wallsComic.user, {
    eager: false,
  })
  wallsComics: Array<WallsComic>;

  @Exclude()
  @OneToMany(() => WallsGame, (wallsGame) => wallsGame.user, {
    eager: false,
  })
  wallsGames: Array<WallsGame>;

  @Exclude()
  @OneToMany(() => WallsManga, (wallsMaga) => wallsMaga.user, {
    eager: false,
  })
  wallsMangas: Array<WallsManga>;

  @Column()
  role: UserRole;

  @Column()
  blocked: boolean;

  @Column()
  enabled: boolean;

  @Exclude()
  @Column({ nullable: true })
  confirmationToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  setRoleAndDisableAndUnblock() {
    this.role = UserRole.USER;
    this.enabled = false;
    this.blocked = false;
    this.contributionPoints = 0;
  }
}
