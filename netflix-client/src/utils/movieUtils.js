export const getMappedMaturity = (maturityLevel) => {
  const raw = maturityLevel || "PG";
  const mapping = {
    "R": "T18",
    "TV-MA": "T18",
    "NC-17": "T18",
    "PG-13": "T13",
    "TV-14": "T13",
    "PG": "K",
    "TV-PG": "K",
    "G": "P",
    "TV-Y": "P",
    "TV-Y7": "P",
    "TV-G": "P"
  };
  return mapping[raw] || raw;
};
