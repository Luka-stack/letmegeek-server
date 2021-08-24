import { ConfigModule } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import User from '../users/entities/user.entity';
import Comment from './entities/comment.entity';
import { UserRole } from '../auth/entities/user-role';
import { CommentDto } from './dto/comment.dto';
import { CommentsService } from './comments.service';
import { UsersRepository } from '../users/users.repository';
import { CommentsRepository } from './comments.repository';
import { PaginationDto } from '../shared/dto/pagination.dto';

const mockCommentsRepository = () => ({
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  commentsCount: jest.fn(),
  deleteUserComment: jest.fn(),
  getCommentsForUser: jest.fn(),
});

const mockUsersRepository = () => ({
  findOne: jest.fn(),
});

const mockUser = (username: string, role: UserRole) => {
  const user = new User();
  user.username = username;
  user.role = role;
  return user;
};

describe('CommentsService', () => {
  let commentsService: CommentsService;
  let commentsRepository;
  let usersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      providers: [
        CommentsService,
        {
          provide: CommentsRepository,
          useFactory: mockCommentsRepository,
        },
        {
          provide: UsersRepository,
          useFactory: mockUsersRepository,
        },
      ],
    }).compile();

    commentsService = module.get<CommentsService>(CommentsService);
    commentsRepository = module.get(CommentsRepository);
    usersRepository = module.get(UsersRepository);
  });

  describe('createComment', () => {
    const commentDto = new CommentDto();
    commentDto.comment = 'Brand New Comment';

    const author = mockUser('Author', UserRole.USER);
    const recipient = mockUser('Recipient', UserRole.USER);

    it('throw NotFoundExcepiton (404), attempt to add comment to users profile that doesnt exsist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      expect(
        commentsService.createComment('Recipient', commentDto, author),
      ).rejects.toThrowError(NotFoundException);
    });

    it('return created comment, successfully create comment', async () => {
      usersRepository.findOne.mockResolvedValue(recipient);
      commentsRepository.create.mockImplementationOnce((dto: any) => {
        const comment = new Comment();
        comment.authorRef = author;
        comment.recipientRef = recipient;
        comment.comment = dto.comment;
        return comment;
      });

      const response = await commentsService.createComment(
        recipient.username,
        commentDto,
        author,
      );

      expect(response).toEqual({
        recipientRef: recipient,
        authorRef: author,
        comment: commentDto.comment,
      });
    });
  });

  describe('getCommentsForUser', () => {
    const paginationDto = new PaginationDto();

    const author = mockUser('Author', UserRole.USER);
    const recipient = mockUser('Recipient', UserRole.USER);
    const comment = new Comment();
    comment.authorRef = author;
    comment.recipientRef = recipient;
    comment.comment = 'Brand New Comment';

    it('return paginated data : total count 0, no prev, no next, no comments', async () => {
      commentsRepository.commentsCount.mockResolvedValue(0);
      commentsRepository.getCommentsForUser.mockResolvedValue([]);

      paginationDto.page = 0;
      paginationDto.limit = 1;

      const response = await commentsService.getCommentsForUser(
        'username',
        paginationDto,
      );

      expect(response).toEqual({
        totalCount: 0,
        page: paginationDto.page,
        limit: paginationDto.limit,
        data: [],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return paginated data : total count 2, no prev page, has next page, has comments', async () => {
      commentsRepository.commentsCount.mockResolvedValue(2);
      commentsRepository.getCommentsForUser.mockResolvedValue([
        comment,
        comment,
      ]);

      paginationDto.page = 0;
      paginationDto.limit = 1;

      const response = await commentsService.getCommentsForUser(
        'username',
        paginationDto,
      );

      expect(response).toEqual({
        totalCount: 2,
        page: paginationDto.page,
        limit: paginationDto.limit,
        data: [comment, comment],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/comments/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('return paginated data : total count 3, has prev page, has next page, has comments', async () => {
      commentsRepository.commentsCount.mockResolvedValue(3);
      commentsRepository.getCommentsForUser.mockResolvedValue([
        comment,
        comment,
        comment,
      ]);

      paginationDto.page = 2;
      paginationDto.limit = 1;

      const response = await commentsService.getCommentsForUser(
        'username',
        paginationDto,
      );

      expect(response).toEqual({
        totalCount: 3,
        page: paginationDto.page,
        limit: paginationDto.limit,
        data: [comment, comment, comment],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/comments/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/comments/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });

    it('return paginated data : comment has a author, recipient, comment and author ImageUrl', async () => {
      commentsRepository.commentsCount.mockResolvedValue(1);
      commentsRepository.getCommentsForUser.mockResolvedValue([comment]);

      paginationDto.page = 1;
      paginationDto.limit = 1;

      const response = await commentsService.getCommentsForUser(
        'username',
        paginationDto,
      );

      expect(response.data[0]).toEqual({
        authorRef: author,
        recipientRef: recipient,
        comment: comment.comment,
      });
    });
  });

  describe('deleteComment', () => {
    it('throw NotFoundException (404), user does not have the comment associated with provided id', async () => {
      const user = mockUser('user', UserRole.USER);

      commentsRepository.deleteUserComment.mockResolvedValue({ affected: 0 });

      expect(
        commentsService.deleteComment('commentId', user),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throw NotFoundException (404), admin user attempt to delete not exsisting comment', async () => {
      const user = mockUser('user', UserRole.ADMIN);

      commentsRepository.delete.mockResolvedValue({ affected: 0 });

      expect(
        commentsService.deleteComment('commentId', user),
      ).rejects.toThrowError(NotFoundException);
    });
  });
});
