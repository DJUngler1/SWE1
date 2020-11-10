

import type { Movie, MovieData } from '../entity';
import {
    MovieInvalid,
    MovieNotExists,
    MovieServiceError,
    IsbnExists,
    TitelExists,
    VersionInvalid,
    VersionOutdated,
} from './errors';
import { MovieModel, validateMovie } from '../entity';
import { dbConfig, logger, mailConfig, serverConfig } from '../../shared';
import { MovieServiceMock } from './mock';
import type { Document } from 'mongoose';
import JSON5 from 'json5';
import type { SendMailOptions } from 'nodemailer';
import { startSession } from 'mongoose';

const { mockDB } = dbConfig;


export class BuchService {
    private readonly mock: MovieServiceMock | undefined;

    constructor() {
        if (mockDB) {
            this.mock = new MovieServiceMock();
        }
    }

    // Status eines Promise:
    // Pending: das Resultat gibt es noch nicht, weil die asynchrone Operation,
    //          die das Resultat liefert, noch nicht abgeschlossen ist
    // Fulfilled: die asynchrone Operation ist abgeschlossen und
    //            das Promise-Objekt hat einen Wert
    // Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //           Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //           Stattdessen ist im Promise-Objekt die Fehlerursache enthalten.


    // Movie mit id suchen
    async findById(id: string) {
        if (this.mock !== undefined) {
            return this.mock.findById(id);
        }
        logger.debug(`BuchService.findById(): id= ${id}`);

        // ein Buch zur gegebenen ID asynchron suchen
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // null falls nicht gefunden
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        // so dass der virtuelle getter "id" auch nicht mehr vorhanden ist
        const buch = await MovieModel.findById(id).lean<MovieData>();
        return buch ?? undefined;
    }

    //Movie mit query suchen
    async find(query?: any | undefined) {
        if (this.mock !== undefined) {
            return this.mock.find(query);
        }

        logger.debug(`MovieService.find(): query=${JSON5.stringify(query)}`);

        // alle Buecher asynchron suchen u. aufsteigend nach titel sortieren
        // https://docs.mongodb.org/manual/reference/object-id
        // entries(): { titel: 'a', rating: 5 } => [{ titel: 'x'}, {rating: 5}]
        if (query === undefined || Object.entries(query).length === 0) {
            logger.debug('BuchService.find(): alle Buecher');
            // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
            return MovieModel.find().sort('titel').lean<MovieData>();
        }

        // { titel: 'a', rating: 5, javascript: true }
        const { titel, javascript, typescript, ...dbQuery } = query; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

        // Buecher zur Query (= JSON-Objekt durch Express) asynchron suchen
        if (titel !== undefined) {
            // Titel in der Query: Teilstring des Titels,
            // d.h. "LIKE" als regulaerer Ausdruck
            // 'i': keine Unterscheidung zw. Gross- u. Kleinschreibung
            // NICHT /.../, weil das Muster variabel sein muss
            // CAVEAT: KEINE SEHR LANGEN Strings wg. regulaerem Ausdruck
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            if (titel.length < 10) {
                dbQuery.titel = new RegExp(titel, 'iu'); // eslint-disable-line security/detect-non-literal-regexp
            }
        }

        
        const schlagwoerter = [];
        if (javascript === 'true') {
            schlagwoerter.push('JAVASCRIPT');
        }
        if (typescript === 'true') {
            schlagwoerter.push('TYPESCRIPT');
        }
        if (schlagwoerter.length === 0) {
            delete dbQuery.schlagwoerter;
        } else {
            dbQuery.schlagwoerter = schlagwoerter;
        }

        logger.debug(`MovieService.find(): dbQuery=${JSON5.stringify(dbQuery)}`);

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // leeres Array, falls nichts gefunden wird
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        return MovieModel.find(dbQuery).lean<MovieData>();
        // Buch.findOne(query), falls das Suchkriterium eindeutig ist
        // bei findOne(query) wird null zurueckgeliefert, falls nichts gefunden
    }

    async create(movieData: Movie) {
        if (this.mock !== undefined) {
            return this.mock.create(movieData);
        }

        logger.debug(
            `MovieService.create(): movieData=${JSON5.stringify(movieData)}`,
        );
        const result = await this.validateCreate(movieData);
        if (result instanceof MovieServiceError) {
            return result;
        }

        const movie = new MovieModel(movieData);
        let movieSaved!: Document;
        // https://www.mongodb.com/blog/post/quick-start-nodejs--mongodb--how-to-implement-transactions
        const session = await startSession();
        try {
            await session.withTransaction(async () => {
                movieSaved = await movie.save();
            });
        } catch (err: unknown) {
            logger.error(
                `MovieService.create(): Die Transaktion wurde abgebrochen: ${JSON5.stringify(
                    err,
                )}`,
            );
            // TODO [2030-09-30] Weitere Fehlerbehandlung bei Rollback
        } finally {
            session.endSession();
        }
        const movieDataSaved: MovieData = movieSaved.toObject(); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        logger.debug(
            `MovieService.create(): movieDataSaved=${JSON5.stringify(
                movieDataSaved,
            )}`,
        );

        await this.sendmail(movieDataSaved);

        return movieDataSaved;
    }

    async update(movieData: Movie, versionStr: string) {
        if (this.mock !== undefined) {
            return this.mock.update(movieData);
        }

        logger.debug(
            `MovieService.update(): movieData=${JSON5.stringify(movieData)}`,
        );
        logger.debug(`MovieService.update(): versionStr=${versionStr}`);

        const validateResult = await this.validateUpdate(movieData, versionStr);
        if (validateResult instanceof MovieServiceError) {
            return validateResult;
        }

        // findByIdAndReplace ersetzt ein Document mit ggf. weniger Properties
        const movie = new MovieModel(movieData);
        const updateOptions = { new: true };
        const result = await MovieModel.findByIdAndUpdate(
            movie._id,
            movie,
            updateOptions,
        ).lean<MovieData>();
        if (result === null) {
            return new MovieNotExists(movie._id);
        }

        if (result.__v !== undefined) {
            result.__v++;
        }
        logger.debug(`MovieService.update(): result=${JSON5.stringify(result)}`);

        // Weitere Methoden von mongoose zum Aktualisieren:
        //    Buch.findOneAndUpdate(update)
        //    buch.update(bedingung)
        return Promise.resolve(result);
    }

    async findOneAndUpdate(update: Movie) {
        if(this.mock !== undefined){
            return this.mock.update(update);
        }
        logger.debug(
            `MovieService.findOneAndUpdate(): update=${JSON5.stringify(update)}`,
        );
        
    }

    async delete(id: string) {
        if (this.mock !== undefined) {
            return this.mock.remove(id);
        }
        logger.debug(`MovieService.delete(): id=${id}`);

        // Das Buch zur gegebenen ID asynchron loeschen
        const { deletedCount } = await MovieModel.deleteOne({ _id: id }); // eslint-disable-line @typescript-eslint/naming-convention
        logger.debug(`MovieService.delete(): deletedCount=${deletedCount}`);
        return deletedCount !== undefined;

        // Weitere Methoden von mongoose, um zu loeschen:
        //  Buch.findByIdAndRemove(id)
        //  Buch.findOneAndRemove(bedingung)
    }

    private async validateCreate(movie: Movie) {
        const msg = validateMovie(movie);
        if (msg !== undefined) {
            logger.debug(
                `BuchService.validateCreate(): Validation Message: ${JSON5.stringify(
                    msg,
                )}`,
            );
            return new BuchInvalid(msg);
        }

        // statt 2 sequentiellen DB-Zugriffen waere 1 DB-Zugriff mit OR besser

        const resultTitel = await this.checkTitelExists(buch);
        if (resultTitel !== undefined) {
            return resultTitel;
        }

        const resultIsbn = await this.checkIsbnExists(buch);
        if (resultIsbn !== undefined) {
            return resultIsbn;
        }

        logger.debug('MovieService.validateCreate(): ok');
        return undefined;
    }

    private async checkTitelExists(movie: Movie) {
        const { titel } = movie;

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const tmpId = await MovieModel.findOne({ titel }, { _id: true }).lean<
            string
        >();
        if (tmpId !== null) {
            logger.debug(
                `MovieService.checkTitelExists(): _id=${JSON5.stringify(tmpId)}`,
            );
            return new TitelExists(titel as string, tmpId);
        }

        logger.debug('MovieService.checkTitelExists(): ok');
        return undefined;
    }

    private async checkIsbnExists(movie: Movie) {
        const { isbn } = movie;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const tmpId = await MovieModel.findOne({ isbn }, { _id: true }).lean<
            string
        >();

        if (tmpId !== null) {
            logger.debug(
                `MovieService.checkIsbnExists(): movie=${JSON5.stringify(tmpId)}`,
            );
            return new IsbnExists(isbn as string, tmpId);
        }

        logger.debug('MovieService.checkIsbnExists(): ok');
        return undefined;
    }

    private async sendmail(movieData: MovieData) {
        if (serverConfig.cloud !== undefined) {
            // In der Cloud kann man z.B. "@sendgrid/mail" statt
            // "nodemailer" mit lokalem Mailserver verwenden
            return;
        }

        const from = '"Wayne Wonder" <Wayne.Wonders@acme.com>';
        const to = '"Dora Deamon" <Dora.Deamon@acme.com>';
        const subject = `Neuer Movie ${movieData._id}`;
        const body = `Der Movie namens <strong>${movieData.titel}</strong> ist angelegt`;

        const data: SendMailOptions = { from, to, subject, html: body };
        logger.debug(`sendMail(): data = ${JSON5.stringify(data)}`);

        try {
            const nodemailer = await import('nodemailer'); // eslint-disable-line node/no-unsupported-features/es-syntax
            await nodemailer.createTransport(mailConfig).sendMail(data);
        } catch (err: unknown) {
            logger.error(
                `MovieService.create(): Fehler beim Verschicken der Email: ${JSON5.stringify(
                    err,
                )}`,
            );
        }
    }

    private async validateUpdate(movie: MovieData, versionStr: string) {
        const result = this.validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        logger.debug(`MovieService.validateUpdate(): version=${version}`);
        logger.debug(
            `MovieService.validateUpdate(): movie=${JSON5.stringify(movie)}`,
        );

        const validationMsg = validateMovie(movie);
        if (validationMsg !== undefined) {
            return new MovieInvalid(validationMsg);
        }

        const resultTitel = await this.checkTitelExists(movie);
        if (resultTitel !== undefined && resultTitel.id !== movie._id) {
            return resultTitel;
        }

        const resultIdAndVersion = await this.checkIdAndVersion(
            movie._id,
            version,
        );
        if (resultIdAndVersion !== undefined) {
            return resultIdAndVersion;
        }

        logger.debug('MovieService.validateUpdate(): ok');
        return undefined;
    }

    private validateVersion(versionStr: string | undefined) {
        if (versionStr === undefined) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                `MovieService.validateVersion(): VersionInvalid=${JSON5.stringify(
                    error,
                )}`,
            );
            return error;
        }

        const version = Number.parseInt(versionStr, 10);
        if (Number.isNaN(version)) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                `MovieService.validateVersion(): VersionInvalid=${JSON5.stringify(
                    error,
                )}`,
            );
            return error;
        }

        return version;
    }

    private async checkIdAndVersion(id: string | undefined, version: number) {
        const movieDb = await MovieModel.findById(id).lean<MovieData>();
        if (movieDb === null) {
            const result = new MovieNotExists(id);
            logger.debug(
                `MovieService.checkIdAndVersion(): MovieNotExists=${JSON5.stringify(
                    result,
                )}`,
            );
            return result;
        }

        const versionDb = movieDb.__v ?? 0;
        if (version < versionDb) {
            const result = new VersionOutdated(id as string, version);
            logger.debug(
                `MovieService.checkIdAndVersion(): VersionOutdated=${JSON5.stringify(
                    result,
                )}`,
            );
            return result;
        }

        return undefined;
    }
}

