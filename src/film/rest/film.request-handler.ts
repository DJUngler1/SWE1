/* eslint-disable max-lines */
import type { FilmData, ValidationErrorMsg } from '../entity';
import {
    FilmInvalid,
    FilmNotExists,
    FilmService,
    FilmServiceError,
    IsbnExists,
    TitelExists,
    VersionInvalid,
    VersionOutdated,
} from '../service';
import type { CreateError, UpdateError } from '../service';
import { HttpStatus, getBaseUri, logger, mimeConfig } from '../../shared';
import type { Request, Response } from 'express';
import JSON5 from 'json5';

export class FilmRequestHandler {
    private readonly service = new FilmService();

    // eslint-disable-next-line max-statements
    async findById(req: Request, res: Response) {
        const versionHeader = req.header('If-None-Match');
        logger.debug(
            `FilmRequestHandler.findById(): versionHeader=${versionHeader}`,
        );
        const { id } = req.params;
        logger.debug(`FilmRequestHandler.findById(): id=${id}`);
        let film: FilmData | undefined;
        try {
            film = await this.service.findById(id);
        } catch (err: unknown) {
            logger.error(
                `FilmRequestHandler.findById(): error=${JSON5.stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        if (film === undefined) {
            logger.debug('FilmRequestHandler.findById(): status=NOT_FOUND');
            res.sendStatus(HttpStatus.NOT_FOUND);
            return;
        }

        logger.debug(
            `FilmRequestHandler.findById(): Film=${JSON5.stringify(film)}`,
        );
        const versionDb = film.__v;
        if (versionHeader === `"${versionDb}"`) {
            res.sendStatus(HttpStatus.NOT_MODIFIED);
            return;
        }
        logger.debug(`FilmRequestHandler.findById(): VersionDb=${versionDb}`);
        res.header('ETag', `"${versionDb}"`);

        const baseUri = getBaseUri(req);
        // eslint-disable-next-line no-underscore-dangle
        film._links = {
            self: { href: `${baseUri}/${id}` },
            list: { href: `${baseUri}` },
            add: { href: `${baseUri}` },
            update: { href: `${baseUri}/${id}` },
            remove: { href: `${baseUri}/${id}` },
        };

        delete film._id;
        delete film.__v;
        delete film.createdAt;
        delete film.updatedAt;
        res.json(film);
    }

    async find(req: Request, res: Response) {
        const { query } = req;
        logger.debug(
            `FilmRequestHandler.find(): queryParams=${JSON5.stringify(query)}`,
        );

        let buecher: FilmData[];
        try {
            buecher = await this.service.find(query);
        } catch (err: unknown) {
            logger.error(
                `FilmRequestHandler.find(): error=${JSON5.stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        logger.debug(
            `FilmRequestHandler.find(): buecher=${JSON5.stringify(buecher)}`,
        );
        if (buecher.length === 0) {
            logger.debug('FilmRequestHandler.find(): status = NOT_FOUND');
            res.sendStatus(HttpStatus.NOT_FOUND);
            return;
        }

        const baseUri = getBaseUri(req);

        for await (const film of buecher) {
            // eslint-disable-next-line no-underscore-dangle
            film._links = { self: { href: `${baseUri}/${film._id}` } };
        }

        logger.debug(
            `FilmRequestHandler.find(): buecher=${JSON5.stringify(buecher)}`,
        );
        buecher.forEach((film) => {
            delete film._id;
            delete film.__v;
            delete film.createdAt;
            delete film.updatedAt;
        });
        res.json(buecher);
    }

    async create(req: Request, res: Response) {
        const contentType = req.header(mimeConfig.contentType);
        if (contentType?.toLowerCase() !== mimeConfig.json) {
            logger.debug('FilmRequestHandler.create() status=NOT_ACCEPTABLE');
            res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
            return;
        }

        const filmData = req.body as FilmData;
        logger.debug(
            `FilmRequestHandler.create(): body=${JSON5.stringify(filmData)}`,
        );

        const result = await this.service.create(filmData);
        if (result instanceof FilmServiceError) {
            this.handleCreateError(result, res);
            return;
        }

        const filmSaved = result;
        const location = `${getBaseUri(req)}/${filmSaved._id}`;
        logger.debug(`FilmRequestHandler.create(): location=${location}`);
        res.location(location);
        res.sendStatus(HttpStatus.CREATED);
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`FilmRequestHandler.update(): id=${id}`);

        const contentType = req.header(mimeConfig.contentType);
        if (contentType?.toLowerCase() !== mimeConfig.json) {
            res.status(HttpStatus.NOT_ACCEPTABLE);
            return;
        }
        const version = this.getVersionHeader(req, res);
        if (version === undefined) {
            return;
        }

        const filmData = req.body as FilmData;
        filmData._id = id;
        logger.debug(
            `FilmRequestHandler.update(): Film=${JSON5.stringify(filmData)}`,
        );

        const result = await this.service.update(filmData, version);
        if (result instanceof FilmServiceError) {
            this.handleUpdateError(result, res);
            return;
        }

        logger.debug(
            `FilmRequestHandler.update(): result=${JSON5.stringify(result)}`,
        );
        const neueVersion = `"${result.__v?.toString()}"`;
        res.set('ETag', neueVersion);
        res.sendStatus(HttpStatus.NO_CONTENT);
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`FilmRequestHandler.delete(): id=${id}`);

        try {
            await this.service.delete(id);
        } catch (err: unknown) {
            logger.error(
                `FilmRequestHandler.delete(): error=${JSON5.stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        logger.debug('FilmRequestHandler.delete(): NO_CONTENT');
        res.sendStatus(HttpStatus.NO_CONTENT);
    }

    private handleCreateError(err: CreateError, res: Response) {
        if (err instanceof FilmInvalid) {
            this.handleValidationError(err.msg, res);
            return;
        }

        if (err instanceof TitelExists) {
            this.handleTitelExists(err.titel, err.id, res);
            return;
        }

        if (err instanceof IsbnExists) {
            this.handleIsbnExists(err.isbn, err.id, res);
        }
    }

    private handleIsbnExists(isbn: string, id: string, res: Response) {
        const msg = `Die ISBN-Nummer "${isbn}" existiert bereits bei ${id}.`;
        logger.debug(`FilmRequestHandler.handleCreateError(): msg=${msg}`);
        res.status(HttpStatus.BAD_REQUEST)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    private handleValidationError(msg: ValidationErrorMsg, res: Response) {
        logger.debug(
            `FilmRequestHandler.handleCreateError(): msg=${JSON.stringify(
                msg,
            )}`,
        );
        res.status(HttpStatus.BAD_REQUEST).send(msg);
    }

    private handleTitelExists(titel: string, id: string, res: Response) {
        const msg = `Der Titel "${titel}" existiert bereits bei ${id}.`;
        logger.debug(`FilmRequestHandler.handleCreateError(): msg=${msg}`);
        res.status(HttpStatus.BAD_REQUEST)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    private getVersionHeader(req: Request, res: Response) {
        const versionHeader = req.header('If-Match');
        logger.debug(
            `FilmRequestHandler.getVersionHeader() versionHeader=${versionHeader}`,
        );

        if (versionHeader === undefined) {
            const msg = 'Versionsnummer fehlt';
            logger.debug(
                `FilmRequestHandler.getVersionHeader(): status=428, message=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        const { length } = versionHeader;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (length < 3) {
            const msg = `Ungueltige Versionsnummer: ${versionHeader}`;
            logger.debug(
                `FilmRequestHandler.getVersionHeader(): status=412, message=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        const version = versionHeader.slice(1, -1);
        logger.debug(
            `FilmRequestHandler.getVersionHeader(): version=${version}`,
        );
        return version;
    }

    private handleUpdateError(err: UpdateError, res: Response) {
        if (err instanceof FilmInvalid) {
            this.handleValidationError(err.msg, res);
            return;
        }

        if (err instanceof FilmNotExists) {
            const { id } = err;
            const msg = `Es gibt kein Film mit der ID "${id}".`;
            logger.debug(`FilmRequestHandler.handleUpdateError(): msg=${msg}`);
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof TitelExists) {
            this.handleTitelExists(err.titel, err.id, res);
            return;
        }

        if (err instanceof VersionInvalid) {
            const { version } = err;
            const msg = `Die Versionsnummer "${version}" ist ungueltig.`;
            logger.debug(`FilmRequestHandler.handleUpdateError(): msg=${msg}`);
            res.status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof VersionOutdated) {
            const { version } = err;
            const msg = `Die Versionsnummer "${version}" ist nicht aktuell.`;
            logger.debug(`FilmRequestHandler.handleUpdateError(): msg=${msg}`);
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
        }
    }
}

/* eslint-enable max-lines */
