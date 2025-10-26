export const stopToBaseKey = (name: string): string => {
  return Buffer.from(name, "utf-8").toString("base64");
};

export const baseKeyToStop = (baseKey: string): string => {
  return Buffer.from(baseKey, "base64")
    .toString("utf-8")
    .replace(/[^a-zA-Z0-9 .,\-()]/g, "");
};
