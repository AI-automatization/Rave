import { ApiResponse, PaginationMeta } from '../types/index';

export const apiResponse = {
  success<T>(data: T, message = 'Success'): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      errors: null,
    };
  },

  error(message: string, errors: string[] | null = null): ApiResponse<null> {
    return {
      success: false,
      data: null,
      message,
      errors,
    };
  },

  paginated<T>(
    data: T[],
    meta: PaginationMeta,
    message = 'Success',
  ): ApiResponse<T[]> {
    return {
      success: true,
      data,
      message,
      errors: null,
      meta,
    };
  },
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
