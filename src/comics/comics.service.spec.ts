import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { slugify } from '../utils/helpers';
import { ComicsRepository } from './comics.repository';
import { ComicsService } from './comics.service';
import Comic from './entities/comic.entity';

const mockComicsRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  getComics: jest.fn(),
  delete: jest.fn(),
});

const mockComic = {
  id: '643790b4-ad59-49dc-baec-f5617e700bac',
  slug: 'title_test',
  identifier: '80Vni9GC',
  title: 'Title Test',
  issues: 55,
  draft: false,
  createdAt: new Date(),
  updatedAt: new Date(),
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
    it('calls ComicsRepository.create and save, creates one and returns newly created comic', async () => {
      // given
      mockComic.createdAt = null;

      comicsRepository.create.mockReturnValue(mockComic);
      comicsRepository.save.mockResolvedValue({});

      // when
      const result = await comicsService.createComic(mockComic);

      // then
      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(mockComic.title),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: mockComic.title,
        draft: mockComic.draft,
        issues: mockComic.issues,
      });
    });

    it('calls ComicsRepository.create and save, returns 409 since Title is not unique', async () => {
      // given
      comicsRepository.create.mockResolvedValue(mockComic);
      comicsRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(comicsService.createComic(mockComic)).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('getComics', () => {
    it('calls ComicsRepository.find, return array of comics', async () => {
      // given
      comicsRepository.getComics.mockResolvedValue([mockComic]);

      // when
      const result = await comicsService.getComics({});

      // then
      expect(result).toHaveLength(1);
      expect(result).toEqual([mockComic]);
    });
  });

  describe('updateComic', () => {
    it('calls ComicsRepository.findOne and throw NotFoundException', async () => {
      comicsRepository.findOne.mockResolvedValue(null);

      expect(comicsService.updateComic('someId', 'slug', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls ComicsRepository.findOne, finds Comic then calls ComicsRepository.save, updates comic and returns comic', async () => {
      // given
      const mockComicObject = new Comic();
      mockComicObject.title = mockComic.title;

      comicsRepository.findOne.mockResolvedValue(mockComicObject);
      comicsRepository.save.mockResolvedValue(mockComicObject);

      // when
      const updateComic = {
        title: 'updatedTitle',
        issues: 999,
      };
      const result = await comicsService.updateComic(
        mockComic.identifier,
        mockComic.slug,
        updateComic,
      );

      // then
      expect(result).toEqual({
        title: updateComic.title,
        issues: updateComic.issues,
      });
    });

    it('calls ComicsRepository.findOne, finds Comic then calls ComicsRepository.save, updates draft to true and updates timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockComicObject = new Comic();
      mockComicObject.title = mockComic.title;
      mockComicObject.createdAt = date;

      comicsRepository.findOne.mockResolvedValue(mockComicObject);
      comicsRepository.save.mockResolvedValue(mockComicObject);

      // when
      const updatedComic = {
        draft: true,
      };
      const result = await comicsService.updateComic(
        mockComic.identifier,
        mockComic.slug,
        updatedComic,
      );

      // then
      expect(result.createdAt).not.toEqual(date);
    });

    it('calls ComicsRepository.findOne, finds Comic then calls ComicsRepository.save, draft and timestamp doesnt change', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockComicObject = new Comic();
      mockComicObject.title = mockComic.title;
      mockComicObject.createdAt = date;

      comicsRepository.findOne.mockResolvedValue(mockComicObject);
      comicsRepository.save.mockResolvedValue(mockComicObject);

      // when
      const updatedComic = {
        issues: 23,
      };
      const result = await comicsService.updateComic(
        mockComic.identifier,
        mockComic.slug,
        updatedComic,
      );

      // then
      expect(result.createdAt).toEqual(date);
    });

    it('calls ComicsRepository.findOne, finds Comic then calls ComicsRepository.save and throw 409 due to not unique Title', async () => {
      // given
      const mockComicObject = new Comic();
      mockComicObject.title = mockComic.title;

      comicsRepository.findOne.mockResolvedValue(mockComicObject);
      comicsRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        comicsService.updateComic(mockComic.identifier, mockComic.slug, {}),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('deleteComic', () => {
    it('calls ComicsRepository.delete, throws NotFoundException', async () => {
      comicsRepository.delete.mockResolvedValue({ affected: 0 });

      expect(comicsService.deleteComic('someId', 'someSlug')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls ComicsRepository.delete, delets Comic and returns void', async () => {
      comicsRepository.delete.mockResolvedValue({ affected: 1 });

      expect(
        comicsService.deleteComic('someId', 'someSlug'),
      ).resolves.toBeCalled();
    });
  });
});
