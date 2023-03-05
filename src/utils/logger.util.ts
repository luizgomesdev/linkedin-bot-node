interface ILevelMap {
  [key: number]: string;
}

class LoggerService {
  private logLevel: number = 2;

  private logLevelMap: ILevelMap = {
    0: "ERROR",
    1: "WARN",
    2: "INFO",
    3: "DEBUG",
    4: "TRACE",
  };

  private loggerName: string;

  constructor(loggerName: string) {
    this.loggerName = loggerName;
  }

  private log(message: string, level: number, ...optionalParams: any[]) {
    if (level <= this.logLevel) {
      console.log(
        `[${this.logLevelMap[level ?? 0] ?? "INFO"}]  ${
          this.loggerName
        } - ${message}`,
        ...optionalParams
      );
    }
  }

  public setLogLevel(level: number) {
    this.logLevel = level;
  }

  public error(message: string, ...optionalParams: any[]) {
    this.log(message, 0, ...optionalParams);
  }

  public warn(message: string, ...optionalParams: any[]) {
    this.log(message, 1, ...optionalParams);
  }

  public info(message: string, ...optionalParams: any[]) {
    this.log(message, 2, ...optionalParams);
  }

  public debug(message: string, ...optionalParams: any[]) {
    this.log(message, 3, ...optionalParams);
  }

  public trace(message: string, ...optionalParams: any[]) {
    this.log(message, 4, ...optionalParams);
  }
}

export default LoggerService;
