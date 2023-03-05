import debug from "debug";
declare const logger: {
    debug: debug.Debugger;
    info: debug.Debugger;
    warn: debug.Debugger;
    error: debug.Debugger;
    enable: () => void;
    disable: () => void;
    enableDebug: () => void;
    enableInfo: () => void;
    enableWarn: () => void;
    enableError: () => void;
};
export { logger };
