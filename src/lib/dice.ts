export const rollD4 = (random: () => number = Math.random): number => {
  return Math.floor(random() * 4) + 1;
};

export const rollD6 = (random: () => number = Math.random): number => {
  return Math.floor(random() * 6) + 1;
};

export const rollD12 = (random: () => number = Math.random): number => {
  return Math.floor(random() * 12) + 1;
};
