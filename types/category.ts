export type Category = {
  id: number;
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
};

export type CategoryListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
};

export type CategoryQueryParams = {
  id?: number;
  name?: string;
  page?: number;
};
