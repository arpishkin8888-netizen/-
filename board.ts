export const board = Array.from({ length: 15 }, () =>
  Array.from({ length: 15 }, () => ({
    letter: null,
    bonus: null    // DL, TL, DW, TW
  }))
);
