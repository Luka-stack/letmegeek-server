import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { makeId, slugify } from '../utils/helpers';
import { GamesRepository } from './games.repository';
import { GamesService } from './games.service';

const mockGamesRepository = () => ({
  createGame: jest.fn((dto) => ({
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: slugify(dto.title),
    identifier: makeId(7),
    ...dto,
  })),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
});

const mockGames = [
  {
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: 'test-slug',
    identifier: '80Vni9G',
    title: 'Title',
    studio: 'Studio',
    publisher: 'Publisher',
    premiered: new Date(),
    draft: false,
  },
];

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
    it('calls GamesRepository.createGame, creates one and return newly created game', async () => {
      const dtoGame = {
        title: 'Title',
        studio: 'Studio',
        description: 'Description',
        publisher: 'Publisher',
        premiered: new Date(),
        draft: false,
      };

      const result = await gamesService.createGame(dtoGame);

      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(dtoGame.title),
        ...dtoGame,
      });
    });
  });

  describe('getGames', () => {
    it('calls GamesRepository.find, return arrray of books', async () => {
      gamesRepository.find.mockResolvedValue(mockGames);
      const result = await gamesService.getGames();

      expect(result).toEqual(mockGames);
    });
  });

  describe('updateGame', () => {
    it('calls GamesRespository.findOne and throw NotFoundException', async () => {
      gamesRepository.findOne.mockResolvedValue(null);

      expect(gamesService.updateGame('someId', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls GamesRepository.findOne, find game then calls GamesRepository.save, updates game and return it', async () => {
      gamesRepository.findOne.mockResolvedValue(mockGames[0]);

      const updatedGame = {
        draft: true,
        title: 'UpdatedTitle',
      };
      const result = await gamesService.updateGame('someId', updatedGame);

      expect(result).toEqual({ ...mockGames[0], ...updatedGame });
    });
  });

  describe('deleteGame', () => {
    it('calls GamesRepository.delete, throw NotFoundException', async () => {
      gamesRepository.delete.mockResolvedValue({ affected: 0 });

      expect(gamesService.deleteGame('someId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls GamesRepository.delete, deletes Game and return void', async () => {
      gamesRepository.delete.mockResolvedValue({ affected: 1 });

      expect(gamesService.deleteGame('someId')).resolves.toBeCalled();
    });
  });
});
