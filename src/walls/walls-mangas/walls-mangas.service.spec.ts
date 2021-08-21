import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import User from '../../users/entities/user.entity';
import Manga from '../../articles/mangas/entities/manga.entity';
import WallsManga from './entities/walls-manga.entity';
import { UserRole } from '../../auth/entities/user-role';
import { MangasRepository } from '../../articles/mangas/mangas.repository';
import { WallArticleStatus } from '../entities/wall-article-status';
import { WallsMangaDto } from './dto/walls-manga.dto';
import { WallsMangasRepository } from './walls-mangas.repository';
import { WallsMangasService } from './walls-mangas.service';

const mockWallsMangasRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  getRecords: jest.fn(),
  findUserRecordByManga: jest.fn(),
});

const mockMangasRepository = () => ({
  findOne: jest.fn(),
});

const wallsMangaDto = () => {
  const wallsManga = new WallsMangaDto();
  wallsManga.status = WallArticleStatus.COMPLETED;
  return wallsManga;
};

const mockWallsManga = (user?: User, manga?: Manga) => {
  const wall = new WallsManga();
  wall.user = user;
  wall.manga = manga;
  wall.status = WallArticleStatus.COMPLETED;
  return wall;
};

const mockManga = () => {
  return new Manga();
};

const mockUser = () => {
  const user = new User();
  user.email = 'test@test.com';
  user.username = 'TestUser';
  user.role = UserRole.USER;
  return user;
};

describe('WallsMangasService', () => {
  let wallsMangasService: WallsMangasService;
  let wallsMangasRepository;
  let mangasRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WallsMangasService,
        {
          provide: WallsMangasRepository,
          useFactory: mockWallsMangasRepository,
        },
        { provide: MangasRepository, useFactory: mockMangasRepository },
      ],
    }).compile();

    wallsMangasService = module.get<WallsMangasService>(WallsMangasService);
    wallsMangasRepository = module.get(WallsMangasRepository);
    mangasRepository = module.get(MangasRepository);
  });

  describe('createRecord', () => {
    it('throw NotFoundException (404), provided wrong mangas identifier', async () => {
      mangasRepository.findOne.mockResolvedValue(null);

      expect(
        wallsMangasService.createRecord('mangaId', null, null),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throw ConflictException (409), provided manga already registered in users wallsmanga', async () => {
      mangasRepository.findOne.mockResolvedValue(mockManga());
      wallsMangasRepository.findOne.mockResolvedValue(mockWallsManga());

      expect(
        wallsMangasService.createRecord('mangaId', null, mockUser()),
      ).rejects.toThrowError(ConflictException);
    });

    it('successfully creates new record', async () => {
      const manga = mockManga();
      const user = mockUser();
      const createDto = wallsMangaDto();

      mangasRepository.findOne.mockResolvedValue(manga);
      wallsMangasRepository.findOne.mockResolvedValue(null);
      wallsMangasRepository.create.mockImplementation((newObject) => {
        const wallsManga = new WallsManga();
        wallsManga.user = newObject.user;
        wallsManga.manga = newObject.manga;
        wallsManga.status = newObject.status;
        return wallsManga;
      });

      const response = await wallsMangasService.createRecord(
        'mangaId',
        createDto,
        user,
      );

      expect(response.user).toEqual(user);
      expect(response.manga).toEqual(manga);
      expect(response.status).toEqual(createDto.status);
    });
  });

  describe('updateRecord', () => {
    it('throw NotFoundExcpetion (404), provided wrong mangas identifier', async () => {
      wallsMangasRepository.findOne.mockResolvedValue(null);

      expect(
        wallsMangasService.updateRecord('mangaId', null, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('update record associated with provided mangas identifier', async () => {
      const updateDto = {
        score: 1,
        status: WallArticleStatus.DROPPED,
        volumes: 50,
        chapters: 24,
        startedAt: new Date(),
        finishedAt: new Date(),
      };
      const wallsManga = mockWallsManga(mockUser(), mockManga());

      wallsMangasRepository.findUserRecordByManga.mockResolvedValue(wallsManga);
      wallsMangasRepository.save.mockImplementation((saved) => {
        return saved;
      });

      const response = await wallsMangasService.updateRecord(
        'mangaId',
        updateDto,
        mockUser(),
      );

      expect(response.score).toEqual(updateDto.score);
      expect(response.status).toEqual(updateDto.status);
      expect(response.volumes).toEqual(updateDto.volumes);
      expect(response.chapters).toEqual(updateDto.chapters);
      expect(response.startedAt).toEqual(updateDto.startedAt);
      expect(response.finishedAt).toEqual(updateDto.finishedAt);
      expect(response.user).toEqual(mockUser());
      expect(response.manga).toEqual(mockManga());
    });
  });

  describe('deleteRecord', () => {
    it('throw NotFoundException (404), provided wrong mangas identifier', async () => {
      wallsMangasRepository.findOne.mockResolvedValue(null);

      expect(
        wallsMangasService.deleteRecord('mangaId', mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  describe('getRecordsByUser', () => {
    it('return list of WallsManga', async () => {
      wallsMangasRepository.getRecords.mockResolvedValue([mockWallsManga()]);

      const response = await wallsMangasService.getRecordsByUser(
        'username',
        null,
      );

      expect(response).toEqual([mockWallsManga()]);
    });
  });
});
