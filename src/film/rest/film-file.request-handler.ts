import {
    FileNotFound,
    FilmFileService,
    FilmFileServiceError,
    FilmNotExists,
    MultipleFiles,
} from './../service';
import { HttpStatus, logger } from '../../shared';
import type { Request, Response } from 'express';
import type { DownloadError } from '../service';
import JSON5 from 'json5';

export class FilmFileRequestHandler {
    private readonly service = new FilmFileService();

    upload(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`FilmFileRequestHandler.uploadBinary(): id=${id}`);

        const data: Uint8Array[] = [];
        let totalBytesInBuffer = 0;

        req.on('data', (chunk: Uint8Array) => {
            const { length } = chunk;
            logger.debug(
                `FilmFileRequestHandler.uploadBinary(): data ${length}`,
            );
            data.push(chunk);
            totalBytesInBuffer += length;
        })
            .on('aborted', () =>
                logger.debug('FilmFileRequestHandler.uploadBinary(): aborted'),
            )
            .on('end', () => {
                logger.debug(
                    `FilmFileRequestHandler.uploadBinary(): end ${totalBytesInBuffer}`,
                );
                const buffer = Buffer.concat(data, totalBytesInBuffer);

                (async () => {
                    try {
                        await this.save(req, id, buffer);
                    } catch (err: unknown) {
                        logger.error(
                            `Fehler beim Abspeichern: ${JSON5.stringify(err)}`,
                        );
                        return;
                    }

                    res.sendStatus(HttpStatus.NO_CONTENT);
                })();
            });
    }

    async download(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`FilmFileRequestHandler.downloadBinary(): ${id}`);
        if ((id as string | undefined) === undefined) {
            res.status(HttpStatus.BAD_REQUEST).send('Keine Film-Id');
            return;
        }

        const findResult = await this.service.find(id);
        if (
            findResult instanceof FilmFileServiceError ||
            findResult instanceof FilmNotExists
        ) {
            this.handleDownloadError(findResult, res);
            return;
        }

        const file = findResult;
        const { readStream, contentType } = file;
        res.contentType(contentType);
        readStream.pipe(res);
    }

    private async save(req: Request, id: string, buffer: Buffer) {
        const contentType = req.headers['content-type'];
        await this.service.save(id, buffer, contentType);
    }

    private handleDownloadError(
        err: FilmNotExists | DownloadError,
        res: Response,
    ) {
        if (err instanceof FilmNotExists) {
            const { id } = err;
            const msg = `Es gibt kein Film mit der ID "${id}".`;
            logger.debug(
                `FilmFileRequestHandler.handleDownloadError(): msg=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof FileNotFound) {
            const { filename } = err;
            const msg = `Es gibt kein File mit Name ${filename}`;
            logger.debug(
                `FilmFileRequestHandler.handleDownloadError(): msg=${msg}`,
            );
            res.status(HttpStatus.NOT_FOUND).send(msg);
            return;
        }

        if (err instanceof MultipleFiles) {
            const { filename } = err;
            const msg = `Es gibt mehr als ein File mit Name ${filename}`;
            logger.debug(
                `FilmFileRequestHandler.handleDownloadError(): msg=${msg}`,
            );
            res.status(HttpStatus.INTERNAL_ERROR).send(msg);
        }
    }
}
