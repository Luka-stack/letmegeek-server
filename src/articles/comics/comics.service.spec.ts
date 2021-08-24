import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import User from '../../users/entities/user.entity';
import Comic from './entities/comic.entity';
import { UserRole } from '../../auth/entities/user-role';
import { ComicsRepository } from './comics.repository';
import { ComicsService } from './comics.service';
import { ComicsFilterDto } from './dto/comics-filter.dto';
import { allWallArticleStatusesModes } from '../../walls/entities/wall-article-status';
import { UpdateComicDto } from './dto/update-comic.dto';

const mockComicsRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  getComic: jest.fn(),
  getComics: jest.fn(),
  getFilterCount: jest.fn(),
});

const mockComic = () => {
  const comic = new Comic();
  comic.id = '643790b4-ad59-49dc-baec-f5617e700bac';
  comic.slug = 'title_test';
  comic.identifier = '80Vni9GC';
  comic.title = 'Title Test';
  comic.issues = 55;
  comic.draft = false;
  comic.updatedAt = new Date();
  return comic;
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
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      providers: [
        ComicsService,
        { provide: ComicsRepository, useFactory: mockComicsRepository },
      ],
    }).compile();

    comicsService = module.get<ComicsService>(ComicsService);
    comicsRepository = module.get(ComicsRepository);
  });

  describe('createComic', () => {
    it('call ComicsRepository.create and save, create and return comic', async () => {
      const comic = mockComic();
      const user = mockUser();

      comicsRepository.create.mockReturnValue(comic);
      comicsRepository.save.mockResolvedValue(comic);

      // when
      const result = await comicsService.createComic(comic, user);

      // then
      const expectedComic = mockComic();
      expectedComic.contributor = user.username;
      expectedComic.draft = true;
      expectedComic.accepted = false;
      expectedComic.createdAt = result.createdAt;
      expectedComic.updatedAt = result.updatedAt;
      expect(result.createdAt).toEqual(expect.any(Date));
      expect(result.updatedAt).toEqual(expect.any(Date));
      expect(result).toEqual(expectedComic);
    });

    it('call ComicsRepository.create and save as an admin user, create and return comic', async () => {
      const comic = mockComic();
      const user = mockUser();

      comicsRepository.create.mockReturnValue(comic);
      comicsRepository.save.mockResolvedValue(comic);

      // when
      user.role = UserRole.ADMIN;
      const result = await comicsService.createComic(comic, user);

      // then
      const expectedComic = mockComic();
      expectedComic.contributor = user.username;
      expectedComic.accepted = !expectedComic.draft;
      expectedComic.createdAt = result.createdAt;
      expectedComic.updatedAt = result.updatedAt;
      expect(result.createdAt).toEqual(expect.any(Date));
      expect(result.updatedAt).toEqual(expect.any(Date));
      expect(result).toEqual(expectedComic);
    });

    it('call ComicsRepository.create and save, return 409 since Title is not unique', async () => {
      const comic = mockComic();

      // given
      comicsRepository.create.mockResolvedValue(comic);
      comicsRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(comicsService.createComic(comic, mockUser())).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('getComics', () => {
    const comicsFilter = new ComicsFilterDto();
    const user = mockUser();

    const comic = {
      comic_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      comic_slug: 'title_test',
      comic_identifier: '80Vni9G',
      comic_title: 'Title Test',
      comic_draft: false,
      comic_createdAt: new Date(),
      comic_updatedAt: new Date(),
      comic_imageUrl: 'image Path',
      comicStats_avgScore: '5',
      comicStats_countScore: '5',
      comicStats_members: '5',
    };

    const comicWithUsersScoring = {
      comic_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      comic_slug: 'title_test',
      comic_identifier: '80Vni9G',
      comic_title: 'Title Test',
      comic_draft: false,
      comic_createdAt: new Date(),
      comic_updatedAt: new Date(),
      comic_imageUrl: 'image Path',
      comicStats_avgScore: '5',
      comicStats_countScore: '5',
      comicStats_members: '5',
      wallComic_status: allWallArticleStatusesModes()[0],
      wallComic_score: '5',
    };

    it('return paginated data : total count 0, no prev, no next, no comica', async () => {
      comicsRepository.getFilterCount.mockResolvedValue(0);
      comicsRepository.getComics.mockResolvedValue([]);

      comicsFilter.page = 0;
      comicsFilter.limit = 1;

      const response = await comicsService.getComics(comicsFilter, mockUser());

      expect(response).toEqual({
        totalCount: 0,
        page: comicsFilter.page,
        limit: comicsFilter.limit,
        data: [],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return paginated data : total count 2, no prev page, has next page, has comics', async () => {
      comicsRepository.getFilterCount.mockResolvedValue(2);
      comicsRepository.getComics.mockResolvedValue([comic, comic]);

      comicsFilter.page = 0;
      comicsFilter.limit = 1;

      const response = await comicsService.getComics(comicsFilter, mockUser());

      expect(response).toEqual({
        totalCount: 2,
        page: comicsFilter.page,
        limit: comicsFilter.limit,
        data: [comic, comic],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/comic/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('return paginated data : total count 3, has prev page, has next page, has comics', async () => {
      comicsRepository.getFilterCount.mockResolvedValue(3);
      comicsRepository.getComics.mockResolvedValue([comic, comic, comic]);

      comicsFilter.page = 2;
      comicsFilter.limit = 1;

      const response = await comicsService.getComics(comicsFilter, user);

      expect(response).toEqual({
        totalCount: 3,
        page: comicsFilter.page,
        limit: comicsFilter.limit,
        data: [comic, comic, comic],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/comics/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/comics/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });

    it('call ComicsRepository.getComics as a user, return array of comics with statistics', async () => {
      comicsFilter.page = 1;
      comicsFilter.limit = 1;

      // given
      comicsRepository.getFilterCount.mockResolvedValue(1);
      comicsRepository.getComics.mockResolvedValue([comic]);

      // when
      const result = await comicsService.getComics(comicsFilter, user);

      // then
      expect(result.data.length).toEqual(1);
      expect(result.data).toEqual([comic]);
    });

    it('call ComicsRepository.getComics as a user, return array of books with statistics and users score', async () => {
      comicsFilter.page = 1;
      comicsFilter.limit = 1;

      // given
      comicsRepository.getFilterCount.mockResolvedValue(1);
      comicsRepository.getComics.mockResolvedValue([
        comic,
        comicWithUsersScoring,
      ]);

      // when
      const result = await comicsService.getComics(comicsFilter, user);

      // then
      expect(result.data.length).toEqual(2);
      expect(result.data[0]).toEqual(comic);
      expect(result.data[1]).toEqual(comicWithUsersScoring);
    });
  });

  describe('getOneComic', () => {
    const user = mockUser();

    const comic = {
      comic_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      comic_slug: 'title_test',
      comic_identifier: '80Vni9G',
      comic_title: 'Title Test',
      comic_draft: false,
      comic_createdAt: new Date(),
      comic_updatedAt: new Date(),
      comic_imageUrl: 'image Path',
      comicStats_avgScore: '5',
      comicStats_countScore: '5',
      comicStats_members: '5',
    };

    const comicWithUsersScoring = {
      comic_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      comic_slug: 'title_test',
      comic_identifier: '80Vni9G',
      comic_title: 'Title Test',
      comic_draft: false,
      comic_createdAt: new Date(),
      comic_updatedAt: new Date(),
      comic_imageUrl: 'image Path',
      comicStats_avgScore: '5',
      comicStats_countScore: '5',
      comicStats_members: '5',
      wallComic_status: allWallArticleStatusesModes()[0],
      wallComic_score: '5',
    };

    it('call ComicsRepository.getOneComic, return comic with statistics', async () => {
      // given
      comicsRepository.getComic.mockResolvedValue(comic);

      // when
      const result = await comicsService.getOneComic(
        'identifier',
        'slug',
        user,
      );

      // then
      expect(result).toEqual(comic);
    });

    it('call ComicsRepository.getOneComic as a user, return comic with statistics and users score', async () => {
      // given
      comicsRepository.getComic.mockResolvedValue(comicWithUsersScoring);

      // when
      const result = await comicsService.getOneComic(
        'identifier',
        'slug',
        user,
      );

      // then
      expect(result).toEqual(comicWithUsersScoring);
    });

    it('call ComicsRepository.getOneComic, return 404', async () => {
      // given
      comicsRepository.getComic.mockResolvedValue(null);

      // when, then
      expect(
        comicsService.getOneComic('someId', 'slug', user),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  describe('updateComic', () => {
    const comic = mockComic();

    it('call ComicsRepository.findOne and throw NotFoundException', async () => {
      comicsRepository.findOne.mockResolvedValue(null);

      expect(
        comicsService.updateComic('someId', 'slug', {}),
      ).rejects.toThrowError(NotFoundException);
    });

    it('call ComicsRepository.findOne, find Comic then calls ComicsRepository.save, update and return comic', async () => {
      // given
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue(comic);

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
      comic.title = updateComic.title;
      comic.issues = updateComic.issues;
      expect(result).toEqual(comic);
    });

    it('call ComicsRepository.findOne, find Comic, validate authors, publishers and genres', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue(comic);

      // when
      const updatedComic = {
        authors: 'Test1, Test1, Test1',
        publishers: 'Test2, Test2, Test2',
        genres: 'Test3, Test3, Test3',
      };
      const result = await comicsService.updateComic(
        comic.identifier,
        comic.slug,
        updatedComic,
      );

      // then
      expect(result.authors).toEqual(updatedComic.authors.replace(' ', ''));
      expect(result.publishers).toEqual(
        updatedComic.publishers.replace(' ', ''),
      );
      expect(result.genres).toEqual(updatedComic.genres.replace(' ', ''));
    });

    it('call ComicsRepository.findOne, find Comic then call ComicsRepository.save, update draft to true and update timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue(comic);

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
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue(comic);

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
      expect(result.createdAt).toEqual(comic.createdAt);
    });

    it('call ComicsRepository.findOne, find Comic then call ComicsRepository.save and throw 409 due to not unique Title', async () => {
      // given
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        comicsService.updateComic(
          comic.identifier,
          comic.slug,
          new UpdateComicDto(),
        ),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('deleteComic', () => {
    it('call ComicsRepository.delete, throw NotFoundException', async () => {
      comicsRepository.delete.mockResolvedValue({ affected: 0 });

      expect(
        comicsService.deleteComic('someId', 'someSlug'),
      ).rejects.toThrowError(NotFoundException);
    });

    // it('call ComicsRepository.delete, delete Comic and returns void', async () => {
    //   comicsRepository.delete.mockResolvedValue({ affected: 1 });

    //   expect(
    //     comicsService.deleteComic('someId', 'someSlug'),
    //   ).resolves.toHaveBeenCalledTimes(1);
    // });
  });
});
