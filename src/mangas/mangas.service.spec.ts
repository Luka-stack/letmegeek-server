import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import Manga from './entities/manga.entity';
import User from '../users/entities/user.entity';
import WallsManga from '../walls/walls-mangas/entities/walls-manga.entity';
import { UserRole } from '../auth/entities/user-role';
import { MangaType } from './entities/manga-type';
import { MangasService } from './mangas.service';
import { MangasRepository } from './mangas.repository';
import { slugify } from '../utils/helpers';
import { MangasFilterDto } from './dto/mangas-filter.dto';

const mockMangasRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  getMangas: jest.fn(),
  getFilterCount: jest.fn(),
  getCompleteManga: jest.fn(),
});

const mockManga = () => {
  return {
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: 'title_test',
    identifier: '80Vni9G',
    title: 'Title test',
    volumes: 55,
    type: MangaType.MANGA,
    createdAt: new Date(),
    updatedAt: new Date(),
    draft: false,
    wallsMangas: [],
  };
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
    it('call MangasRepository.createManga and save, create and return manga', async () => {
      // given
      const manga = mockManga();
      manga.createdAt = null;
      mangasRepository.create.mockReturnValue(manga);
      mangasRepository.save.mockResolvedValue({});

      // when
      const result = await mangasService.createManga(manga, mockUser());

      // then
      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(manga.title),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: manga.title,
        volumes: manga.volumes,
        type: manga.type,
        wallsMangas: [],
        draft: true,
      });
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
      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(manga.title),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: manga.title,
        volumes: manga.volumes,
        type: manga.type,
        wallsMangas: [],
        draft: manga.draft,
      });
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
    const manga = mockManga();
    const wallsManga = new WallsManga();
    wallsManga.username = user.username;
    wallsManga.score = 2;
    manga.wallsMangas = [wallsManga];

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

    it('call MangasRepository.getMangas as a user, return array of mangas with users wallsmanga', async () => {
      mangasFilter.page = 1;
      mangasFilter.limit = 1;

      mangasRepository.getFilterCount.mockResolvedValue(1);
      mangasRepository.getMangas.mockResolvedValue([manga]);

      // when
      const result = await mangasService.getMangas(mangasFilter, user);

      // then
      expect(result.data).toEqual([manga]);
      expect(result.data[0].userWallsManga).toEqual(wallsManga);
    });
  });

  describe('getOneManga', () => {
    const manga = mockManga();
    const user = mockUser();
    const wallsManga = new WallsManga();
    wallsManga.username = user.username;
    wallsManga.score = 5;
    manga.wallsMangas = [wallsManga];

    it('call MangasRepository.getOneManga, return manga', async () => {
      // given
      mangasRepository.getCompleteManga.mockResolvedValue(manga);

      // when
      const result = await mangasService.getOneManga(
        'identifier',
        'slug',
        null,
      );

      // then
      expect(result).toEqual(manga);
    });

    it('call MangasRepository.getOneManga as a user, return manga with users wallsbook', async () => {
      // given
      mangasRepository.getCompleteManga.mockResolvedValue(manga);

      // when
      const result = await mangasService.getOneManga(
        'identifier',
        'slug',
        user,
      );

      // then
      expect(result).toEqual(manga);
      expect(result.userWallsManga).toEqual(wallsManga);
    });

    it('call MangasRepository.getOneManga, return 404', async () => {
      // given
      mangasRepository.getCompleteManga.mockResolvedValue(null);

      // when, then
      expect(
        mangasService.getOneManga('someId', 'slug', null),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  describe('updateManga', () => {
    const manga = mockManga();
    const mangaClass = new Manga();

    it('call MangasRepository.findOne and return 404', async () => {
      // given
      mangasRepository.findOne.mockResolvedValue(null);

      expect(
        mangasService.updateManga('someId', 'someSlug', {}),
      ).rejects.toThrowError(NotFoundException);
    });

    it('call MangasRepository.findOne, find Manga then call MangasRepository.save, update and returns Manga', async () => {
      // given
      mangaClass.title = manga.title;
      mangasRepository.findOne.mockResolvedValue(mangaClass);
      mangasRepository.save.mockResolvedValue(mangaClass);

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
      expect(result).toEqual({
        title: updateManga.title,
        volumes: updateManga.volumes,
        premiered: updateManga.premiered,
      });
    });

    it('call MangasRepository.findOne, find Manga then call MangasRepository.save, update draft to true and update timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      mangaClass.title = manga.title;
      mangaClass.createdAt = date;
      mangasRepository.findOne.mockResolvedValue(mangaClass);
      mangasRepository.save.mockResolvedValue(mangaClass);

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
      const date = new Date();
      date.setFullYear(2000);

      mangaClass.title = manga.title;
      mangaClass.createdAt = date;
      mangasRepository.findOne.mockResolvedValue(mangaClass);
      mangasRepository.save.mockResolvedValue(mangaClass);

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
      expect(result.createdAt).toEqual(date);
    });

    it('call MangasRepository.findOne, find Manga then call MangasRepository.save and throw 409 due to not unique Title', async () => {
      // given
      mangaClass.title = manga.title;
      mangasRepository.findOne.mockResolvedValue(mangaClass);
      mangasRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        mangasService.updateManga(manga.identifier, manga.slug, {}),
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
