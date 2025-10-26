import dayjs from "dayjs";

export function unixToDayjs(timestamp: number): dayjs.Dayjs | null {
  const date = dayjs.unix(timestamp);
  return date.isValid() ? date : null;
}

export function todayYyyymmdd(): string {
  return dayjs().format("YYYYMMDD");
}

export function yyyymmddToDayjs(dateStr: string): dayjs.Dayjs | null {
  const date = dayjs(dateStr, "YYYYMMDD");
  return date.isValid() ? date : null;
}
