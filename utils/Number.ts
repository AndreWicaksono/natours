export const generateNumberBetweenRange: (from?: number, to?: number) => number = (
    from = 0,
    to = 8
) => Math.floor(Math.random() * to) + from;
