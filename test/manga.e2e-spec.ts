import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { MangasService } from '../src/mangas/mangas.service';
import { MangasController } from '../src/mangas/mangas.controller';
import { MangasRepository } from '../src/mangas/mangas.repository';
import { makeId, slugify } from '../src/utils/helpers';
import Manga from '../src/mangas/entities/manga.entity';

const mockMangasRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  getMangas: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('MangasController (e2e)', () => {
  let app: INestApplication;
  let mangasRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MangasController],
      providers: [
        MangasService,
        { provide: MangasRepository, useFactory: mockMangasRepository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    mangasRepository = moduleFixture.get(MangasRepository);
    await app.init();
  });

  describe('/api/mangas (POST)', () => {
    const mangaDto = {
      title: 'Newe Title',
      draft: false,
      premiered: new Date(),
    };

    it('returns created Manga and status 201', async () => {
      // given
      mangasRepository.create.mockImplementation((dto) => {
        return {
          id: 'someId',
          identifier: makeId(2),
          slug: slugify(dto.title),
          updatedAt: new Date(),
          createdAt: new Date(),
          ...dto,
        };
      });
      mangasRepository.save.mockResolvedValue({});

      // when them
      const response = await request(app.getHttpServer())
        .post('/api/mangas')
        .send(mangaDto)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(mangaDto.title),
        title: mangaDto.title,
        draft: mangaDto.draft,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        premiered: mangaDto.premiered.toISOString(),
      });
    });

    it('returns status 409, didnt create Manga due to the title not being unique', async () => {
      // given
      mangasRepository.save.mockRejectedValue({ code: 23505 });

      // when then
      await request(app.getHttpServer())
        .post('/api/mangas')
        .send(mangaDto)
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/mangas (GET)', () => {
    it('returns list of mangas and status 200', async () => {
      // given
      mangasRepository.getMangas.mockResolvedValue([new Manga()]);

      // when then
      const response = await request(app.getHttpServer())
        .get('/api/mangas')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('/api/mangas/:identifier (PATCH)', () => {
    it('manga not found, returns status 404', async () => {
      // given
      mangasRepository.findOne.mockResolvedValue(null);

      // when then
      await request(app.getHttpServer())
        .patch('/api/mangas/identifier/slug')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('returns updated Manga and status 200', async () => {
      // given
      const mockMangaClass = new Manga();
      mockMangaClass.title = 'Old Title';
      mockMangaClass.premiered = new Date();

      mangasRepository.findOne.mockResolvedValue(mockMangaClass);
      mangasRepository.save.mockResolvedValue({});

      // when
      const mangaDto = {
        title: 'Updated One',
        chapters: 999,
      };
      const response = await request(app.getHttpServer())
        .patch('/api/mangas/identifier/slug')
        .send(mangaDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.title).toEqual(mangaDto.title);
      expect(response.body.chapters).toEqual(mangaDto.chapters);
    });

    it('updates draft to true, returns 200 and updated Manga with updated timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockMangaClass = new Manga();
      mockMangaClass.title = 'Old Title';
      mockMangaClass.createdAt = date;

      mangasRepository.findOne.mockResolvedValue(mockMangaClass);
      mangasRepository.save.mockResolvedValue({});

      // when then
      const response = await request(app.getHttpServer())
        .patch('/api/mangas/identifier/slug')
        .send({ draft: true })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.createdAt).not.toEqual(date);
    });

    it('draft stays the same, returns 200 and updated Manga with old timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockMangaClass = new Manga();
      mockMangaClass.title = 'Old Title';
      mockMangaClass.finished = new Date();
      mockMangaClass.createdAt = date;

      mangasRepository.findOne.mockResolvedValue(mockMangaClass);
      mangasRepository.save.mockResolvedValue({});

      // when then
      const response = await request(app.getHttpServer())
        .patch('/api/mangas/identifier/slug')
        .send({ chapters: 1000 })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.createdAt).toEqual(date.toISOString());
    });

    it('returns status 409, didnt create Manga due to the title not being unique', async () => {
      // given
      mangasRepository.findOne.mockResolvedValue(new Manga());
      mangasRepository.save.mockRejectedValue({ code: 23505 });

      // when then
      await request(app.getHttpServer())
        .patch('/api/mangas/identifier/slug')
        .send({})
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/mangas/:identifier (DELETE)', () => {
    it('manga not found, returns status 404', async () => {
      // given
      mangasRepository.delete.mockResolvedValue({ affected: 0 });

      // when then
      await request(app.getHttpServer())
        .delete('/api/mangas/identifier/slug')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('delets manga and return status 204', async () => {
      // given
      mangasRepository.delete.mockResolvedValue({ affected: 1 });

      // when then
      await request(app.getHttpServer())
        .delete('/api/mangas/identifier/slug')
        .expect(204);
    });
  });
});
