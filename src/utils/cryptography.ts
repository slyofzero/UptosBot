export const bytesToHex = (buffer: Uint8Array): string =>
  Array.from(buffer)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
