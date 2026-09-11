/** Roll numbers are positive whole numbers. */
export const isValidRoll = (value) => /^\d+$/.test(String(value).trim()) && Number(value) > 0;
