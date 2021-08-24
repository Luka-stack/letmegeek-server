import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import Manga from './entities/manga.entity';
import User from '../../users/entities/user.entity';
import { UserRole } from '../../auth/entities/user-role';
import { MangaType } from './entities/manga-type';
import { MangasService } from './mangas.service';
import { MangasRepository } from './mangas.repository';
import { MangasFilterDto } from './dto/mangas-filter.dto';
import { allWallArticleStatusesModes } from '../../walls/entities/wall-article-status';
import { UpdateMangaDto } from './dto/update-manga.dto';

const mockMangasRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  getManga: jest.fn(),
  getMangas: jest.fn(),
  getFilterCount: jest.fn(),
});

const mockManga = () => {
  const manga = new Manga();
  manga.id = '643790b4-ad59-49dc-baec-f5617e700bac';
  manga.slug = 'title_test';
  manga.identifier = '80Vni9G';
  manga.title = 'Title test';
  manga.volumes = 55;
  manga.type = MangaType.MANGA;
  manga.updatedAt = new Date();
  manga.draft = false;
  return manga;
};

const mockUser = () => {
  const user = new User();
  user.email = 'test@test.com';
  user.username = 'TestUser';
  user.role = UserRole.USER;
  return user;
};

describe('MangasService', () => {
  let mangasService: MangasService;
  let mangasRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      providers: [
        MangasService,
        { provide: MangasRepository, useFactory: mockMangasRepository },
      ],
    }).compile();

    mangasService = module.get<MangasService>(MangasService);
    mangasRepository = module.get(MangasRepository);
  });

  describe('createManga', () => {
    it('call MangasRepository.createManga as a normal user and save, create draft and return manga', async () => {
      // given
      const manga = mockManga();
      const user = mockUser();
      mangasRepository.create.mockReturnValue(manga);
      mangasRepository.save.mockResolvedValue(manga);

      // when
      const result = await mangasService.createManga(manga, user);

      // then
      const expectedManga = mockManga();
      expectedManga.contributor = user.username;
      expectedManga.draft = true;
      expectedManga.accepted = false;
      expectedManga.createdAt = result.createdAt;
      expectedManga.updatedAt = result.updatedAt;
      expect(result.createdAt).toEqual(expect.any(Date));
      expect(result.updatedAt).toEqual(expect.any(Date));
      expect(result).toEqual(expectedManga);
    });

    it('call MangasRepository.createManga as an admin user, create book and returns it', async () => {
      // given
      const manga = mockManga();
      mangasRepository.create.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue(manga);

      // when
      const user = mockUser();
      user.role = UserRole.ADMIN;
      const result = await mangasService.createManga(manga, user);

      // then
      const expectedManga = mockManga();
      expectedManga.contributor = user.username;
      expectedManga.accepted = !expectedManga.draft;
      expectedManga.createdAt = result.createdAt;
      expectedManga.updatedAt = result.updatedAt;
      expect(result.createdAt).toEqual(expect.any(Date));
      expect(result.updatedAt).toEqual(expect.any(Date));
      expect(result).toEqual(expectedManga);
    });

    it('call MangasRepository.createManga and save, return 409 since Title is not unique', async () => {
      // given
      mangasRepository.create.mockReturnValue(mockManga());
      mangasRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        mangasService.createManga(mockManga(), mockUser()),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('getMangas', () => {
    const mangasFilter = new MangasFilterDto();
    const user = mockUser();

    const manga = {
      manga_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      manga_slug: 'title_test',
      manga_identifier: '80Vni9G',
      manga_title: 'Title Test',
      manga_draft: false,
      manga_createdAt: new Date(),
      manga_updatedAt: new Date(),
      manga_volumes: '55',
      manga_type: MangaType.MANGA,
      manga_imageUrl: 'image Path',
      mangaStats_avgScore: '5',
      mangaStats_countScore: '5',
      mangaStats_members: '5',
    };

    const mangaWithUsersScoring = {
      manga_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      manga_slug: 'title_test',
      manga_identifier: '80Vni9G',
      manga_title: 'Title Test',
      manga_draft: false,
      manga_createdAt: new Date(),
      manga_updatedAt: new Date(),
      manga_imageUrl: 'image Path',
      manga_volumes: '55',
      manga_type: MangaType.MANGA,
      mangaStats_avgScore: '5',
      mangaStats_countScore: '5',
      mangaStats_members: '5',
      wallManga_status: allWallArticleStatusesModes()[0],
      wallManga_score: '5',
    };

    it('return paginated data : total count 0, no prev, no next, no mangas', async () => {
      mangasRepository.getFilterCount.mockResolvedValue(0);
      mangasRepository.getMangas.mockResolvedValue([]);

      mangasFilter.page = 0;
      mangasFilter.limit = 1;

      const response = await mangasService.getMangas(mangasFilter, mockUser());

      expect(response).toEqual({
        totalCount: 0,
        page: mangasFilter.page,
        limit: mangasFilter.limit,
        data: [],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return paginated data : total count 2, no prev page, has next page, has mangas', async () => {
      mangasRepository.getFilterCount.mockResolvedValue(2);
      mangasRepository.getMangas.mockResolvedValue([manga, manga]);

      mangasFilter.page = 0;
      mangasFilter.limit = 1;

      const response = await mangasService.getMangas(mangasFilter, mockUser());

      expect(response).toEqual({
        totalCount: 2,
        page: mangasFilter.page,
        limit: mangasFilter.limit,
        data: [manga, manga],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/mangas/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('return paginated data : total count 3, has prev page, has next page, has mangas', async () => {
      mangasRepository.getFilterCount.mockResolvedValue(3);
      mangasRepository.getMangas.mockResolvedValue([manga, manga, manga]);

      mangasFilter.page = 2;
      mangasFilter.limit = 1;

      const response = await mangasService.getMangas(mangasFilter, user);

      expect(response).toEqual({
        totalCount: 3,
        page: mangasFilter.page,
        limit: mangasFilter.limit,
        data: [manga, manga, manga],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/mangas/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/mangas/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });

    it('call MangasRepository.getMangas as a user, return array of mangas with statistics', async () => {
      mangasFilter.page = 1;
      mangasFilter.limit = 1;

      mangasRepository.getFilterCount.mockResolvedValue(1);
      mangasRepository.getMangas.mockResolvedValue([manga]);

      // when
      const result = await mangasService.getMangas(mangasFilter, user);

      // then
      expect(result.data.length).toEqual(1);
      expect(result.data).toEqual([manga]);
    });

    it('call MangasRepository.getMangas as a user, return array of mangas with statistics and users score', async () => {
      mangasFilter.page = 1;
      mangasFilter.limit = 1;

      mangasRepository.getFilterCount.mockResolvedValue(1);
      mangasRepository.getMangas.mockResolvedValue([
        manga,
        mangaWithUsersScoring,
      ]);

      // when
      const result = await mangasService.getMangas(mangasFilter, user);

      // then
      expect(result.data.length).toEqual(2);
      expect(result.data[0]).toEqual(manga);
      expect(result.data[1]).toEqual(mangaWithUsersScoring);
    });
  });

  describe('getOneManga', () => {
    const user = mockUser();

    const manga = {
      manga_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      manga_slug: 'title_test',
      manga_identifier: '80Vni9G',
      manga_title: 'Title Test',
      manga_draft: false,
      manga_createdAt: new Date(),
      manga_updatedAt: new Date(),
      manga_volumes: '55',
      manga_type: MangaType.MANGA,
      manga_imageUrl: 'image Path',
      mangaStats_avgScore: '5',
      mangaStats_countScore: '5',
      mangaStats_members: '5',
    };

    const mangaWithUsersScoring = {
      manga_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      manga_slug: 'title_test',
      manga_identifier: '80Vni9G',
      manga_title: 'Title Test',
      manga_draft: false,
      manga_createdAt: new Date(),
      manga_updatedAt: new Date(),
      manga_imageUrl: 'image Path',
      manga_volumes: '55',
      manga_type: MangaType.MANGA,
      mangaStats_avgScore: '5',
      mangaStats_countScore: '5',
      mangaStats_members: '5',
      wallManga_status: allWallArticleStatusesModes()[0],
      wallManga_score: '5',
    };

    it('call MangasRepository.getOneManga, return manga with statistics', async () => {
      // given
      mangasRepository.getManga.mockResolvedValue(manga);

      // when
      const result = await mangasService.getOneManga(
        'identifier',
        'slug',
        user,
      );

      // then
      expect(result).toEqual(manga);
    });

    it('call MangasRepository.getOneManga as a user, return manga with statistics and users score', async () => {
      // given
      mangasRepository.getManga.mockResolvedValue(mangaWithUsersScoring);

      // when
      const result = await mangasService.getOneManga(
        'identifier',
        'slug',
        user,
      );

      // then
      expect(result).toEqual(mangaWithUsersScoring);
    });

    it('call MangasRepository.getOneManga, return 404', async () => {
      // given
      mangasRepository.getManga.mockResolvedValue(null);

      // when, then
      expect(
        mangasService.getOneManga('someId', 'slug', user),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  describe('updateManga', () => {
    const manga = mockManga();

    it('call MangasRepository.findOne and return 404', async () => {
      // given
      mangasRepository.findOne.mockResolvedValue(null);

      expect(
        mangasService.updateManga('someId', 'someSlug', {}),
      ).rejects.toThrowError(NotFoundException);
    });

    it('call MangasRepository.findOne, find Manga then call MangasRepository.save, update and returns Manga', async () => {
      // given
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue(manga);

      // when
      const updateManga = {
        title: 'updatedTitle',
        volumes: 999,
        premiered: new Date(),
      };
      const result = await mangasService.updateManga(
        manga.identifier,
        manga.slug,
        updateManga,
      );

      // then
      manga.title = updateManga.title;
      manga.volumes = updateManga.volumes;
      manga.premiered = updateManga.premiered;
      expect(result).toEqual(manga);
    });

    it('call MangasRepository.findOne, find Manga, validate authors, publishers and genres', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue(manga);

      // when
      const updatedManga = {
        authors: 'Test1, Test1, Test1',
        publishers: 'Test2, Test2, Test2',
        genres: 'Test3, Test3, Test3',
      };
      const result = await mangasService.updateManga(
        manga.identifier,
        manga.slug,
        updatedManga,
      );

      // then
      expect(result.authors).toEqual(updatedManga.authors.replace(' ', ''));
      expect(result.publishers).toEqual(
        updatedManga.publishers.replace(' ', ''),
      );
      expect(result.genres).toEqual(updatedManga.genres.replace(' ', ''));
    });

    it('call MangasRepository.findOne, find Manga then call MangasRepository.save, update draft to true and update timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue(manga);

      // when
      const updatedManga = {
        draft: true,
      };
      const result = await mangasService.updateManga(
        manga.identifier,
        manga.slug,
        updatedManga,
      );

      // then
      expect(result.createdAt).not.toEqual(date);
    });

    it('call MangasRepository.findOne, find Manga then call MangasRepository.save, draft and timestamp doesnt change', async () => {
      // given
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue(manga);

      // when
      const updatedManga = {
        volumes: 23,
      };
      const result = await mangasService.updateManga(
        manga.identifier,
        manga.slug,
        updatedManga,
      );

      // then
      expect(result.createdAt).toEqual(manga.createdAt);
    });

    it('call MangasRepository.findOne, find Manga then call MangasRepository.save and throw 409 due to not unique Title', async () => {
      // given
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        mangasService.updateManga(
          manga.identifier,
          manga.slug,
          new UpdateMangaDto(),
        ),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('deleteManga', () => {
    it('call MangasRepository.delete, throws 404', async () => {
      // given
      mangasRepository.delete.mockResolvedValue({ affected: 0 });

      // when then
      expect(mangasService.deleteManga('someId', 'someSlug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
