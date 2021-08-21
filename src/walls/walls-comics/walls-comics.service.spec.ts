import { Test, TestingModule } from '@nestjs/testing';

import User from '../../users/entities/user.entity';
import Comic from '../../articles/comics/entities/comic.entity';
import WallsComic from './entities/walls-comic.entity';
import { UserRole } from '../../auth/entities/user-role';
import { WallsComicDto } from './dto/walls-comic.dto';
import { WallArticleStatus } from '../entities/wall-article-status';
import { WallsComicsService } from './walls-comics.service';
import { ComicsRepository } from '../../articles/comics/comics.repository';
import { WallsComicsRepository } from './walls-comics.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockWallsComicsRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  getRecords: jest.fn(),
  findUserRecordByComic: jest.fn(),
});

const mockComicsRepository = () => ({
  findOne: jest.fn(),
});

const wallsComicDto = () => {
  const wallsComic = new WallsComicDto();
  wallsComic.status = WallArticleStatus.COMPLETED;
  return wallsComic;
};

const mockWallsComic = (user?: User, comic?: Comic) => {
  const wall = new WallsComic();
  wall.user = user;
  wall.comic = comic;
  wall.status = WallArticleStatus.COMPLETED;
  return wall;
};

const mockComic = () => {
  return new Comic();
};

const mockUser = () => {
  const user = new User();
  user.email = 'test@test.com';
  user.username = 'TestUser';
  user.role = UserRole.USER;
  return user;
};

describe('WallsComicsService', () => {
  let wallsComicsService: WallsComicsService;
  let wallsComicsRepository;
  let comicsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WallsComicsService,
        {
          provide: WallsComicsRepository,
          useFactory: mockWallsComicsRepository,
        },
        { provide: ComicsRepository, useFactory: mockComicsRepository },
      ],
    }).compile();

    wallsComicsService = module.get<WallsComicsService>(WallsComicsService);
    wallsComicsRepository = module.get(WallsComicsRepository);
    comicsRepository = module.get(ComicsRepository);
  });

  describe('createRecord', () => {
    it('throw NotFoundException (404), comic book related to provided identifier doesnt exists', async () => {
      comicsRepository.findOne.mockResolvedValue(null);

      expect(
        wallsComicsService.createRecord('comicId', null, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throw ConfictException (409), comic book related to provided identifier already exsists in users wall', async () => {
      comicsRepository.findOne.mockResolvedValue(mockComic());
      wallsComicsRepository.findOne.mockResolvedValue(mockWallsComic());

      expect(
        wallsComicsService.createRecord('comicId', null, mockUser()),
      ).rejects.toThrowError(ConflictException);
    });

    it('successfully creates new record', async () => {
      comicsRepository.findOne.mockResolvedValue(mockComic());
      wallsComicsRepository.findOne.mockResolvedValue(null);
      wallsComicsRepository.create.mockImplementation((createObject) => {
        const wall = new WallsComic();
        wall.user = createObject.user;
        wall.comic = createObject.comic;
        wall.status = createObject.status;
        return wall;
      });

      const response = await wallsComicsService.createRecord(
        'comicId',
        wallsComicDto(),
        mockUser(),
      );

      expect(response.user).toEqual(mockUser());
      expect(response.comic).toEqual(mockComic());
      expect(response.status).toEqual(wallsComicDto().status);
    });
  });

  describe('updateRecord', () => {
    it('throw NotFoundException (404), provided wrong comic book identifier', async () => {
      wallsComicsRepository.findOne.mockResolvedValue(null);

      expect(
        wallsComicsService.updateRecord('comicId', null, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('update record related to provided comic identifier', async () => {
      const wallsComic = mockWallsComic(mockUser(), mockComic());
      const updateDto = {
        score: 1,
        issues: 500,
        status: WallArticleStatus.DROPPED,
        startedAt: new Date(),
        finishedAt: new Date(),
      };

      wallsComicsRepository.findUserRecordByComic.mockResolvedValue(wallsComic);
      wallsComicsRepository.save.mockImplementation((saved) => {
        return saved;
      });

      const response: WallsComic = await wallsComicsService.updateRecord(
        'comicId',
        updateDto,
        mockUser(),
      );

      expect(response.score).toEqual(updateDto.score);
      expect(response.issues).toEqual(updateDto.issues);
      expect(response.status).toEqual(updateDto.status);
      expect(response.startedAt).toEqual(updateDto.startedAt);
      expect(response.finishedAt).toEqual(updateDto.finishedAt);
      expect(response.user).toEqual(wallsComic.user);
      expect(response.comic).toEqual(wallsComic.comic);
    });
  });

  describe('deleteRecord', () => {
    it('throw NotFoundException (404), provided wrong comic books identifier', async () => {
      wallsComicsRepository.findOne.mockResolvedValue(null);

      expect(
        wallsComicsService.deleteRecord('comicId', mockUser()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRecordsByUser', () => {
    it('return list of WallsComic', async () => {
      wallsComicsRepository.getRecords.mockResolvedValue([mockWallsComic()]);

      const response = await wallsComicsService.getRecordsByUser(
        'username',
        null,
      );

      expect(response).toEqual([mockWallsComic()]);
    });
  });
});
