import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import User from '../users/entities/user.entity';
import Comic from './entities/comic.entity';
import WallsComic from '../walls/walls-comics/entities/walls-comic.entity';
import { UserRole } from '../auth/entities/user-role';
import { slugify } from '../utils/helpers';
import { ComicsRepository } from './comics.repository';
import { ComicsService } from './comics.service';

const mockComicsRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  getComics: jest.fn(),
  getCompleteComic: jest.fn(),
  delete: jest.fn(),
});

const mockComic = () => {
  return {
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: 'title_test',
    identifier: '80Vni9GC',
    title: 'Title Test',
    issues: 55,
    draft: false,
    wallsComics: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

const mockUser = () => {
  const user = new User();
  user.email = 'test@test.com';
  user.username = 'TestUser';
  user.role = UserRole.USER;
  return user;
};

describe('ComicsService', () => {
  let comicsService: ComicsService;
  let comicsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComicsService,
        { provide: ComicsRepository, useFactory: mockComicsRepository },
      ],
    }).compile();

    comicsService = module.get<ComicsService>(ComicsService);
    comicsRepository = module.get(ComicsRepository);
  });

  describe('createComic', () => {
    const comic = mockComic();

    it('call ComicsRepository.create and save, create and return comic', async () => {
      comicsRepository.create.mockReturnValue(comic);
      comicsRepository.save.mockResolvedValue({});

      // when
      const result = await comicsService.createComic(comic, mockUser());

      // then
      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(comic.title),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: comic.title,
        draft: true,
        issues: comic.issues,
        wallsComics: [],
      });
    });

    it('call ComicsRepository.create and save as an admin user, create and return comic', async () => {
      comicsRepository.create.mockReturnValue(comic);
      comicsRepository.save.mockResolvedValue({});

      // when
      const user = mockUser();
      user.role = UserRole.ADMIN;
      const result = await comicsService.createComic(comic, user);

      // then
      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(comic.title),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: comic.title,
        draft: comic.draft,
        issues: comic.issues,
        wallsComics: [],
      });
    });

    it('call ComicsRepository.create and save, return 409 since Title is not unique', async () => {
      // given
      comicsRepository.create.mockResolvedValue(comic);
      comicsRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(comicsService.createComic(comic, null)).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('getComics', () => {
    const user = mockUser();
    const comic = mockComic();
    const wallsComic = new WallsComic();
    wallsComic.username = user.username;
    wallsComic.score = 2;
    comic.wallsComics = [wallsComic];

    it('call ComicsRepository.getComics, return array of comics', async () => {
      // given
      comicsRepository.getComics.mockResolvedValue([comic]);

      // when
      const result = await comicsService.getComics(null, null);

      // then
      expect(result).toHaveLength(1);
      expect(result).toEqual([comic]);
    });

    it('call ComicsRepository.getComics as a user, return array of comics with users wallsComic', async () => {
      // given
      comicsRepository.getComics.mockResolvedValue([comic]);

      // when
      const result = await comicsService.getComics(null, user);

      // then
      expect(result).toHaveLength(1);
      expect(result).toEqual([comic]);
      expect(result[0].userWallsComic).toEqual(wallsComic);
    });
  });

  describe('getOneComic', () => {
    const book = mockComic();
    const user = mockUser();
    const wallsComic = new WallsComic();
    wallsComic.username = user.username;
    wallsComic.score = 5;
    book.wallsComics = [wallsComic];

    it('call ComicsRepository.getOneComic, return comic', async () => {
      // given
      comicsRepository.getCompleteComic.mockResolvedValue(book);

      // when
      const result = await comicsService.getOneComic(
        'identifier',
        'slug',
        null,
      );

      // then
      expect(result).toEqual(book);
    });

    it('call ComicsRepository.getOneComic as a user, return comic with users wallsComic', async () => {
      // given
      comicsRepository.getCompleteComic.mockResolvedValue(book);

      // when
      const result = await comicsService.getOneComic(
        'identifier',
        'slug',
        user,
      );

      // then
      expect(result).toEqual(book);
      expect(result.userWallsComic).toEqual(wallsComic);
    });

    it('call ComicsRepository.getOneComic, return 404', async () => {
      // given
      comicsRepository.getCompleteComic.mockResolvedValue(null);

      // when, then
      expect(
        comicsService.getOneComic('someId', 'slug', null),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  describe('updateComic', () => {
    const comic = mockComic();
    const comicClass = new Comic();

    it('call ComicsRepository.findOne and throw NotFoundException', async () => {
      comicsRepository.findOne.mockResolvedValue(null);

      expect(comicsService.updateComic('someId', 'slug', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('call ComicsRepository.findOne, find Comic then calls ComicsRepository.save, update and return comic', async () => {
      // given
      comicClass.title = comic.title;
      comicsRepository.findOne.mockResolvedValue(comicClass);
      comicsRepository.save.mockResolvedValue(comicClass);

      // when
      const updateComic = {
        title: 'updatedTitle',
        issues: 999,
      };
      const result = await comicsService.updateComic(
        comic.identifier,
        comic.slug,
        updateComic,
      );

      // then
      expect(result).toEqual({
        title: updateComic.title,
        issues: updateComic.issues,
      });
    });

    it('call ComicsRepository.findOne, find Comic then call ComicsRepository.save, update draft to true and update timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      comicClass.title = comic.title;
      comicClass.createdAt = date;

      comicsRepository.findOne.mockResolvedValue(comicClass);
      comicsRepository.save.mockResolvedValue(comicClass);

      // when
      const updatedComic = {
        draft: true,
      };
      const result = await comicsService.updateComic(
        comic.identifier,
        comic.slug,
        updatedComic,
      );

      // then
      expect(result.createdAt).not.toEqual(date);
    });

    it('call ComicsRepository.findOne, find Comic then call ComicsRepository.save, draft and timestamp doesnt change', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      comicClass.title = comic.title;
      comicClass.createdAt = date;
      comicsRepository.findOne.mockResolvedValue(comicClass);
      comicsRepository.save.mockResolvedValue(comicClass);

      // when
      const updatedComic = {
        issues: 23,
      };
      const result = await comicsService.updateComic(
        comic.identifier,
        comic.slug,
        updatedComic,
      );

      // then
      expect(result.createdAt).toEqual(date);
    });

    it('call ComicsRepository.findOne, find Comic then call ComicsRepository.save and throw 409 due to not unique Title', async () => {
      // given
      comicClass.title = comic.title;
      comicsRepository.findOne.mockResolvedValue(comicClass);
      comicsRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        comicsService.updateComic(comic.identifier, comic.slug, {}),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('deleteComic', () => {
    it('call ComicsRepository.delete, throw NotFoundException', async () => {
      comicsRepository.delete.mockResolvedValue({ affected: 0 });

      expect(comicsService.deleteComic('someId', 'someSlug')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('call ComicsRepository.delete, delet Comic and returns void', async () => {
      comicsRepository.delete.mockResolvedValue({ affected: 1 });

      expect(
        comicsService.deleteComic('someId', 'someSlug'),
      ).resolves.toBeCalled();
    });
  });
});
