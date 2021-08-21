import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

import User from '../../users/entities/user.entity';
import Manga from './entities/manga.entity';
import { UserRole } from '../../auth/entities/user-role';
import { MangaDto } from './dto/manga.dto';
import { UpdateMangaDto } from './dto/update-manga.dto';
import { MangasFilterDto } from './dto/mangas-filter.dto';
import { MangasRepository } from './mangas.repository';
import { removeSpacesFromCommaSeparatedString } from '../../utils/helpers';
import { PaginatedMangasDto } from './dto/paginated-mangas.dto';

@Injectable()
export class MangasService {
  constructor(
    @InjectRepository(MangasRepository)
    private readonly mangasRepository: MangasRepository,
    private readonly configService: ConfigService,
  ) {}

  async createManga(mangaDto: MangaDto, user: User): Promise<Manga> {
    if (user.role === UserRole.USER) {
      mangaDto.draft = true;
    }

    if (mangaDto.authors) {
      mangaDto.authors = removeSpacesFromCommaSeparatedString(mangaDto.authors);
    }

    if (mangaDto.publishers) {
      mangaDto.publishers = removeSpacesFromCommaSeparatedString(
        mangaDto.publishers,
      );
    }

    if (mangaDto.genres) {
      mangaDto.genres = removeSpacesFromCommaSeparatedString(mangaDto.genres);
    }

    const manga = this.mangasRepository.create(mangaDto);
    manga.createdAt = new Date();

    await this.mangasRepository.save(manga).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return manga;
  }

  async getMangas(
    filterDto: MangasFilterDto,
    user: User,
  ): Promise<PaginatedMangasDto> {
    filterDto.limit = Number(filterDto.limit);
    filterDto.page = Number(filterDto.page);

    const totalCount = await this.mangasRepository.getFilterCount(filterDto);
    const mangas = await this.mangasRepository.getMangas(
      filterDto,
      user?.username,
    );

    const apiQuery = this.createQuery(filterDto);

    const nextPage = `${this.configService.get(
      'APP_URL',
    )}/api/articles/mangas?${apiQuery}page=${filterDto.page + 1}&limit=${
      filterDto.limit
    }`;
    const prevPage = `${this.configService.get(
      'APP_URL',
    )}/api/articles/mangas?${apiQuery}page=${filterDto.page - 1}&limit=${
      filterDto.limit
    }`;

    return {
      totalCount,
      page: filterDto.page,
      limit: filterDto.limit,
      data: mangas,
      nextPage: filterDto.page * filterDto.limit < totalCount ? nextPage : '',
      prevPage: filterDto.page >= 2 ? prevPage : '',
    };
  }

  async getOneManga(
    identifier: string,
    slug: string,
    user: User,
  ): Promise<any> {
    const manga = await this.mangasRepository.getManga(
      identifier,
      slug,
      user?.username,
    );

    if (!manga) {
      throw new NotFoundException('Manga not found');
    }

    return manga;
  }

  async updateManga(
    identifier: string,
    slug: string,
    updateMangaDto: UpdateMangaDto,
  ): Promise<Manga> {
    const manga = await this.mangasRepository.findOne({ identifier, slug });

    if (!manga) {
      throw new NotFoundException('Manga not found');
    }

    if (updateMangaDto.authors) {
      updateMangaDto.authors = removeSpacesFromCommaSeparatedString(
        updateMangaDto.authors,
      );
    }

    if (updateMangaDto.publishers) {
      updateMangaDto.publishers = removeSpacesFromCommaSeparatedString(
        updateMangaDto.publishers,
      );
    }

    if (updateMangaDto.genres) {
      updateMangaDto.genres = removeSpacesFromCommaSeparatedString(
        updateMangaDto.genres,
      );
    }

    manga.mapDtoToEntity(updateMangaDto);
    if (updateMangaDto.draft != null && updateMangaDto.draft) {
      manga.createdAt = new Date();
    }

    await this.mangasRepository.save(manga).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return manga;
  }

  async deleteManga(identifier: string, slug): Promise<void> {
    const result = await this.mangasRepository.delete({ identifier, slug });

    if (result.affected === 0) {
      throw new NotFoundException('Manga not found');
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    identifier: string,
    slug: string,
  ): Promise<Manga> {
    const manga = await this.mangasRepository.findOne({ identifier, slug });

    if (!manga) {
      throw new NotFoundException('Manga not found');
    }

    const oldImage = manga.imageUrn || '';
    manga.imageUrn = file.filename;

    await this.mangasRepository.save(manga);

    if (oldImage !== '') {
      fs.unlinkSync(`public\\images\\${oldImage}`);
    }

    return manga;
  }

  createQuery(filterDto: MangasFilterDto): string {
    let query = '';

    if (filterDto.finished) {
      query += `finished=${filterDto.finished}&`;
    }

    if (filterDto.type) {
      query += `type=${filterDto.type}&`;
    }

    if (filterDto.volumes) {
      query += `volumes=${filterDto.volumes}&`;
    }

    if (filterDto.authors) {
      query += `authors=${filterDto.authors}&`;
    }

    if (filterDto.genres) {
      query += `genres=${filterDto.genres}&`;
    }

    if (filterDto.name) {
      query += `name=${filterDto.name}&`;
    }

    if (filterDto.premiered) {
      query += `premiered=${filterDto.premiered}&`;
    }

    if (filterDto.publishers) {
      query += `publishers=${filterDto.publishers}&`;
    }

    return query;
  }
}
