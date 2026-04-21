export const extractHouseNumber = (address: string): number => {
  if (!address) return 0;
  const match = address.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

export const sortByHouseNumber = <T extends { Адрес: string }>(
  items: T[],
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...items].sort((a, b) => {
    const numA = extractHouseNumber(a.Адрес);
    const numB = extractHouseNumber(b.Адрес);
    return order === 'asc' ? numA - numB : numB - numA;
  });
};