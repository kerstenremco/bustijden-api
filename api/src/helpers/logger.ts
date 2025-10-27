export enum LogType {
  INFO = "INFO",
  ERROR = "ERROR",
}
export enum LogSource {
  API = "API",
  REALTIMESYNC = "REALTIMESYNC",
}

export const logMessage = (logType: LogType, logSource: LogSource, message: String) => {
  console.log(`[${logType}] [${logSource}] ${message}`);
};
