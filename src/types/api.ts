export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ErrorResponse = {
  success: false;
  error: string;
  message?: string;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export type PaginatedResponse<T> = ApiResponse<T> & {
  total?: number;
  page?: number;
  limit?: number;
};
