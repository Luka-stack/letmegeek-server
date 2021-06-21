import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import Manga from './entities/manga.entity';
import { slugify } from '../utils/helpers';
import { MangasRepository } from './mangas.repository';
import { MangasService } from './mangas.service';

const mockMangasRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  getMangas: jest.fn(),
  delete: jest.fn(),
});

const mockManga = {
  id: '643790b4-ad59-49dc-baec-f5617e700bac',
  slug: 'title_test',
  identifier: '80Vni9G',
  title: 'Title test',
  volumes: 55,
  createdAt: new Date(),
  updatedAt: new Date(),
  draft: false,
};

describe('MangasService', () => {
  let mangasService: MangasService;
  let mangasRepository;

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
    it('calls MangasRepository.create and save, creates one and return newly created manga', async () => {
      // given
      mockManga.createdAt = null;

      mangasRepository.create.mockReturnValue(mockManga);
      mangasRepository.save.mockResolvedValue({});

      // when
      const result = await mangasService.createManga(mockManga);

      // then
      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(mockManga.title),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: mockManga.title,
        draft: mockManga.draft,
        volumes: mockManga.volumes,
      });
    });

    it('calls MangasRepository.create and save, returns 409 since Title is not unique', async () => {
      // given
      mangasRepository.create.mockReturnValue(mockManga);
      mangasRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(mangasService.createManga(mockManga)).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('getMangas', () => {
    it('calls MangasRepository.getMangas, returns array of mangas', async () => {
      // gien
      mangasRepository.getMangas.mockResolvedValue([mockManga]);

      // when
      const result = await mangasService.getMangas({});

      // then
      expect(result).toEqual([mockManga]);
    });
  });

  describe('updateManga', () => {
    it('calls MangasRepository.findOne and return 404', async () => {
      // given
      mangasRepository.findOne.mockResolvedValue(null);

      expect(
        mangasService.updateManga('someId', 'someSlug', {}),
      ).rejects.toThrowError(NotFoundException);
    });

    it('calls MangasRepository.findOne, finds Manga then calls MangasRepository.save, updates Manga and returns Manga', async () => {
      // given
      const mockMangaClass = new Manga();
      mockMangaClass.title = mockManga.title;

      mangasRepository.findOne.mockResolvedValue(mockMangaClass);
      mangasRepository.save.mockResolvedValue(mockMangaClass);

      // when
      const updateManga = {
        title: 'updatedTitle',
        volumes: 999,
        premiered: new Date(),
      };
      const result = await mangasService.updateManga(
        mockManga.identifier,
        mockManga.slug,
        updateManga,
      );

      // then
      expect(result).toEqual({
        title: updateManga.title,
        volumes: updateManga.volumes,
        premiered: updateManga.premiered,
      });
    });

    it('calls MangasRepository.findOne, finds Manga then calls MangasRepository.save, updates draft to true and updates timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockMangaClass = new Manga();
      mockMangaClass.title = mockManga.title;
      mockMangaClass.createdAt = date;

      mangasRepository.findOne.mockResolvedValue(mockMangaClass);
      mangasRepository.save.mockResolvedValue(mockMangaClass);

      // when
      const updatedManga = {
        draft: true,
      };
      const result = await mangasService.updateManga(
        mockManga.identifier,
        mockManga.slug,
        updatedManga,
      );

      // then
      expect(result.createdAt).not.toEqual(date);
    });

    it('calls MangasRepository.findOne, finds Manga then calls MangasRepository.save, draft and timestamp doesnt change', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockMangaClass = new Manga();
      mockMangaClass.title = mockManga.title;
      mockMangaClass.createdAt = date;

      mangasRepository.findOne.mockResolvedValue(mockMangaClass);
      mangasRepository.save.mockResolvedValue(mockMangaClass);

      // when
      const updatedManga = {
        volumes: 23,
      };
      const result = await mangasService.updateManga(
        mockManga.identifier,
        mockManga.slug,
        updatedManga,
      );

      // then
      expect(result.createdAt).toEqual(date);
    });

    it('calls MangasRepository.findOne, finds Manga then calls MangasRepository.save and throw 409 due to not unique Title', async () => {
      // given
      const mockMangaClass = new Manga();
      mockMangaClass.title = mockManga.title;

      mangasRepository.findOne.mockResolvedValue(mockMangaClass);
      mangasRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        mangasService.updateManga(mockManga.identifier, mockManga.slug, {}),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('deleteManga', () => {
    it('calls MangasRepository.delete, throws 404', async () => {
      // given
      mangasRepository.delete.mockResolvedValue({ affected: 0 });

      // when then
      expect(mangasService.deleteManga('someId', 'someSlug')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls MangasRepsitory.delete, delets Manga and returns void', async () => {
      // given
      mangasRepository.delete.mockResolvedValue({ affected: 1 });

      // when then
      expect(mangasService.deleteManga('someId', 'someSlug')).resolves
        .toHaveBeenCalled;
    });
  });
});
