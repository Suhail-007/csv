
export interface SortConfig {
  [key: string]: 'asc' | 'desc';
}

export const createQueryFilter = (filters: Record<string, string | number>) => {
  let params = '';

  for (const [key, value] of Object.entries(filters)) {

    if (Object.keys(params).length > 0) {
      params += `&`;
    }

    if (Object.keys(params).length === 0) {
      params += `?${key}=${value}`;
      continue
    }

    if (Object.keys(params).length > 1) {
      params += `${key}=${value}`;
    }
  }

  return params;
};