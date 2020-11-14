import { consoleOptions, fileOptions, serverConfig } from './config';
import { createLogger, transports } from 'winston';
import JSON5 from 'json5';


const { cloud } = serverConfig;
const { Console, File } = transports; // eslint-disable-line @typescript-eslint/naming-convention
/* eslint-disable object-curly-newline */
export const logger =
    cloud === undefined
        ? createLogger({
              transports: [new Console(consoleOptions), new File(fileOptions)],
          })
        : createLogger({
              transports: new Console(consoleOptions),
          });
/* eslint-enable object-curly-newline */

logger.info('Logging durch Winston ist konfiguriert');
logger.debug(`consoleOptions: ${JSON5.stringify(consoleOptions)}`);

if (cloud === undefined) {
    logger.debug(`fileOptions: ${JSON5.stringify(fileOptions)}`);
}
