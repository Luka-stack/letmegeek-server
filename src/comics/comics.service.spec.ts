import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';

import { makeId, slugify } from '../utils/helpers';
import { ComicsRepository } from './comics.repository';
import { ComicsService } from './comics.service';
import Comic from './entities/comic.entity';

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

const mockComicsRepository = () => ({
  createComic: jest.fn((dto) => ({
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: slugify(dto.title),
    identifier: makeId(7),
    ...dto,
  })),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

const mockComics = [
  {
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: 'test-slug',
    identifier: '80Vni9G',
    title: 'Title',
    author: 'Author',
    publisher: 'Publisher',
    premiered: new Date(),
    draft: false,
  },
];

describe('ComicsService', () => {
  let comicsService: ComicsService;
  let comicsRepository: MockType<Repository<Comic>>;

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
    it('calls ComicsRepository.createComic, creates one and returns newly created comic', async () => {
      const dtoComic = {
        title: 'Title',
        author: 'Author',
        description: 'Description',
        publisher: 'Publisher',
        premiered: new Date(),
        draft: false,
      };

      const result = await comicsService.createComic(dtoComic);

      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(dtoComic.title),
        ...dtoComic,
      });
    });
  });

  describe('getComics', () => {
    it('calls ComicsRepository.find, return array of comics', async () => {
      comicsRepository.find.mockResolvedValue(mockComics);

      const result = await comicsService.getComics();
      expect(result).toEqual(mockComics);
    });
  });

  describe('updateComic', () => {
    it('calls ComicsRepository.findOne and throw NotFoundException', async () => {
      comicsRepository.findOne.mockResolvedValue(null);

      expect(comicsService.updateComic('someId', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls ComicsRepository.findOne, finds comic then calls ComicsRepository.save, updates comic and returns it', async () => {
      comicsRepository.findOne.mockResolvedValue(mockComics[0]);

      const updateComic = {
        publisher: 'Updated',
        description: 'UpdatedDesc',
      };
      const result = await comicsService.updateComic('someId', updateComic);

      expect(result).toEqual({ ...mockComics[0], ...updateComic });
    });
  });

  describe('deleteComic', () => {
    it('calls ComicsRepository.delete, throws NotFoundException', async () => {
      comicsRepository.delete.mockResolvedValue({ affected: 0 });

      expect(comicsService.deleteComic('someId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls ComicsRepository.delete, delets Comic and returns void', async () => {
      comicsRepository.delete.mockResolvedValue({ affected: 1 });

      expect(comicsService.deleteComic('someId')).resolves.toBeCalled();
    });
  });
});
