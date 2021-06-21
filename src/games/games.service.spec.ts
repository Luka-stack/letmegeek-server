import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import Game from './entities/game.entity';
import { slugify } from '../utils/helpers';
import { GamesRepository } from './games.repository';
import { GamesService } from './games.service';

const mockGamesRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  getGames: jest.fn(),
  delete: jest.fn(),
});

const mockGame = {
  id: '643790b4-ad59-49dc-baec-f5617e700bac',
  slug: 'test-slug',
  identifier: '80Vni9G',
  title: 'Title Slug',
  gears: 'PlayStation 5',
  createdAt: new Date(),
  updatedAt: new Date(),
  draft: false,
};

describe('GamesService', () => {
  let gamesService: GamesService;
  let gamesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        { provide: GamesRepository, useFactory: mockGamesRepository },
      ],
    }).compile();

    gamesService = module.get<GamesService>(GamesService);
    gamesRepository = module.get(GamesRepository);
  });

  describe('createGame', () => {
    it('calls GamesRepository.create and save, creates one and return newly created Game', async () => {
      // given
      mockGame.createdAt = null;

      gamesRepository.create.mockReturnValue(mockGame);
      gamesRepository.save.mockResolvedValue({});

      // when
      const result = await gamesService.createGame(mockGame);

      // then
      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(mockGame.title),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: mockGame.title,
        draft: mockGame.draft,
        gears: mockGame.gears,
      });
    });

    it('calls GamesRepository.create and save, returns 409 since Title is not unique', async () => {
      // given
      gamesRepository.create.mockReturnValue(mockGame);
      gamesRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(gamesService.createGame(mockGame)).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('getMangas', () => {
    it('calls GamesRepository.getGames, returns array of games', async () => {
      // gien
      gamesRepository.getMangas.mockResolvedValue([mockGame]);

      // when
      const result = await gamesService.getGames({});

      // then
      expect(result).toEqual([mockGame]);
    });
  });

  describe('updateGame', () => {
    it('calls GamesRepository.findOne and return 404', async () => {
      // given
      gamesRepository.findOne.mockResolvedValue(null);

      expect(
        gamesService.updateGame('someId', 'someSlug', {}),
      ).rejects.toThrowError(NotFoundException);
    });

    it('calls GamesRepository.findOne, finds Game then calls GamesRepository.save, updates Manga and returns Game', async () => {
      // given
      const mockGameClass = new Game();
      mockGameClass.title = mockGame.title;

      gamesRepository.findOne.mockResolvedValue(mockGameClass);
      gamesRepository.save.mockResolvedValue(mockGameClass);

      // when
      const updateGame = {
        title: 'updatedTitle',
        volumes: 999,
        premiered: new Date(),
      };
      const result = await gamesService.updateGame(
        mockGame.identifier,
        mockGame.slug,
        updateGame,
      );

      // then
      expect(result).toEqual({
        title: updateGame.title,
        volumes: updateGame.volumes,
        premiered: updateGame.premiered,
      });
    });

    it('calls GamesRepository.findOne, finds Manga then calls GamesRepository.save, updates draft to true and updates timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockGameClass = new Game();
      mockGameClass.title = mockGame.title;
      mockGameClass.createdAt = date;

      gamesRepository.findOne.mockResolvedValue(mockGameClass);
      gamesRepository.save.mockResolvedValue(mockGameClass);

      // when
      const updateGame = {
        draft: true,
      };
      const result = await gamesService.updateGame(
        mockGame.identifier,
        mockGame.slug,
        updateGame,
      );

      // then
      expect(result.createdAt).not.toEqual(date);
    });

    it('calls GamesRepository.findOne, finds Manga then calls GamesRepository.save, draft and timestamp doesnt change', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockGameClass = new Game();
      mockGameClass.title = mockGame.title;
      mockGameClass.createdAt = date;

      gamesRepository.findOne.mockResolvedValue(mockGameClass);
      gamesRepository.save.mockResolvedValue(mockGameClass);

      // when
      const updateGame = {
        completeTime: 23,
      };
      const result = await gamesService.updateGame(
        mockGame.identifier,
        mockGame.slug,
        updateGame,
      );

      // then
      expect(result.createdAt).toEqual(date);
    });

    it('calls GamesRepository.findOne, finds Manga then calls GamesRepository.save and throw 409 due to not unique Title', async () => {
      // given
      const mockGameClass = new Game();
      mockGameClass.title = mockGame.title;

      gamesRepository.findOne.mockResolvedValue(mockGameClass);
      gamesRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        gamesService.updateGame(mockGame.identifier, mockGame.slug, {}),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('deleteManga', () => {
    it('calls GamesRepository.delete, throws 404', async () => {
      // given
      gamesRepository.delete.mockResolvedValue({ affected: 0 });

      // when then
      expect(gamesService.deleteGame('someId', 'someSlug')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls GamesRepository.delete, delets Manga and returns void', async () => {
      // given
      gamesRepository.delete.mockResolvedValue({ affected: 1 });

      // when then
      expect(gamesService.deleteGame('someId', 'someSlug')).resolves
        .toHaveBeenCalled;
    });
  });
});
