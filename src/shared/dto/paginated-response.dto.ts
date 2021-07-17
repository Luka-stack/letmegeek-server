export class PaginatedResponseDto {
  page: number;
  limit: number;
  totalCount: number;
  nextPage: string;
  prevPage: string;
}
