import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';

import Manga from './entities/manga.entity';
import { makeId, slugify } from '../utils/helpers';
import { MangasRepository } from './mangas.repository';
import { MangasService } from './mangas.service';
import { NotFoundException } from '@nestjs/common';

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

const mockMangasRepository = () => ({
  createManga: jest.fn((dto) => ({
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

const mockManga = {
  id: '643790b4-ad59-49dc-baec-f5617e700bac',
  slug: 'test-slug',
  identifier: '80Vni9G',
  title: 'Title',
  author: 'Author',
  publisher: 'Publisher',
  premiered: new Date(),
  draft: false,
};

describe('MangasService', () => {
  let mangasService: MangasService;
  let mangasRepository: MockType<Repository<Manga>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MangasService,
        { provide: MangasRepository, useFactory: mockMangasRepository },
      ],
    }).compile();

    mangasService = module.get<MangasService>(MangasService);
    mangasRepository = module.get(MangasRepository);
  });

  describe('createManga', () => {
    it('calls MangasRepository.createManga, creates one and return newly created comic', async () => {
      const dtoManga = {
        title: 'Title',
        author: 'Author',
        description: 'Description',
        publisher: 'Publisher',
        premiered: new Date(),
        draft: false,
      };

      const result = await mangasService.createManga(dtoManga);

      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(dtoManga.title),
        ...dtoManga,
      });
    });
  });

  describe('getMangas', () => {
    it('calls MangasRepository.find, returns array of mangas', async () => {
      mangasRepository.find.mockResolvedValue([mockManga]);

      const result = await mangasService.getMangas();
      expect(result).toEqual([mockManga]);
    });
  });

  describe('updateManga', () => {
    it('calls MangasRepository.findOne and throw NotFoundException', async () => {
      mangasRepository.findOne.mockResolvedValue(null);

      expect(mangasService.updateManga('someId', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('class MangasRepsitory.findOne, finds Manga then calls MangasRepsitory.save, updates Manga and returns it', async () => {
      mangasRepository.findOne.mockResolvedValue(mockManga);

      const updateManga = {
        title: 'Updated',
        author: 'Updated',
        draft: true,
      };
      const result = await mangasService.updateManga('someId', updateManga);

      expect(result).toEqual({ ...mockManga, ...updateManga });
    });
  });

  describe('deleteManga', () => {
    it('calls MangasRepository.delete, throws NotFoundExcpetion', async () => {
      mangasRepository.delete.mockResolvedValue({ affected: 0 });

      expect(mangasService.deleteManga('someId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls MangasRepsitory.delete, delets Manga and returns void', async () => {
      mangasRepository.delete.mockResolvedValue({ affected: 1 });

      expect(mangasService.deleteManga('someId')).resolves.toBeCalled();
    });
  });
});
