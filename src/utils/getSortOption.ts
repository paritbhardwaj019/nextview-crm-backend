export const getSortOption = (
  sortBy: string,
  sortOrder: string
): Record<string, 1 | -1> => {
  return { [sortBy]: sortOrder === "asc" ? 1 : -1 };
};
