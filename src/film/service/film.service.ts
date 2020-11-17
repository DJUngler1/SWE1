/* eslint-disable max-lines */
import type { Film, FilmData } from '../entity';
import {
    FilmInvalid,
    FilmNotExists,
    FilmServiceError,
    TitelExists,
    VersionInvalid,
    VersionOutdated,
} from './errors';
import { FilmModel, validateFilm } from '../entity';
import { dbConfig, logger, mailConfig, serverConfig } from '../../shared';
import type { Document } from 'mongoose';
import { FilmServiceMock } from './mock';
import JSON5 from 'json5';
import type { SendMailOptions } from 'nodemailer';
import { startSession } from 'mongoose';

const { mockDB } = dbConfig;

/* eslint-disable require-await, no-null/no-null, unicorn/no-useless-undefined */
export class FilmService {
    private readonly mock: FilmServiceMock | undefined;

    constructor() {
        if (mockDB) {
            this.mock = new FilmServiceMock();
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

    // Film mit id suchen
    async findById(id: string) {
        if (this.mock !== undefined) {
            return this.mock.findById(id);
        }
        logger.debug(`FilmService.findById(): id= ${id}`);

        // einen Film zur gegebenen ID asynchron suchen
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // null falls nicht gefunden
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        // so dass der virtuelle getter "id" auch nicht mehr vorhanden ist
        const film = await FilmModel.findById(id).lean<FilmData>();
        return film ?? undefined;
    }

    // Film mit query suchen
    async find(query?: any | undefined) {
        if (this.mock !== undefined) {
            return this.mock.find(query);
        }

        logger.debug(`FilmService.find(): query=${JSON5.stringify(query)}`);

        // alle Filme asynchron suchen u. aufsteigend nach titel sortieren
        // https://docs.mongodb.org/manual/reference/object-id
        // entries(): { titel: 'a', rating: 5 } => [{ titel: 'x'}, {rating: 5}]
        if (query === undefined || Object.entries(query).length === 0) {
            logger.debug('FilmService.find(): alle Filme');
            // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
            return FilmModel.find().sort('titel').lean<FilmData>();
        }

        // { titel: 'a', rating: 5, javascript: true }
        const { titel, scifi, psychothriller, ...dbQuery } = query; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

        // Filme zur Query (= JSON-Objekt durch Express) asynchron suchen
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

        const kategorien = [];
        if (scifi === 'true') {
            kategorien.push('SCI-FI');
        }
        if (psychothriller === 'true') {
            kategorien.push('PSYCHOTHRILLER');
        }
        if (kategorien.length === 0) {
            delete dbQuery.kategorien;
        } else {
            dbQuery.kategorien = kategorien;
        }

        logger.debug(`FilmService.find(): dbQuery=${JSON5.stringify(dbQuery)}`);

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // leeres Array, falls nichts gefunden wird
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        return FilmModel.find(dbQuery).lean<FilmData>();
        // Film.findOne(query), falls das Suchkriterium eindeutig ist
        // bei findOne(query) wird null zurueckgeliefert, falls nichts gefunden
    }

    async create(filmData: Film) {
        if (this.mock !== undefined) {
            return this.mock.create(filmData);
        }

        logger.debug(
            `FilmService.create(): filmData=${JSON5.stringify(filmData)}`,
        );
        const result = await this.validateCreate(filmData);
        if (result instanceof FilmServiceError) {
            return result;
        }

        const film = new FilmModel(filmData);
        let filmSaved!: Document;
        // https://www.mongodb.com/blog/post/quick-start-nodejs--mongodb--how-to-implement-transactions
        const session = await startSession();
        try {
            await session.withTransaction(async () => {
                filmSaved = await film.save();
            });
        } catch (err: unknown) {
            logger.error(
                `FilmService.create(): Die Transaktion wurde abgebrochen: ${JSON5.stringify(
                    err,
                )}`,
            );
            // TODO [2030-09-30] Weitere Fehlerbehandlung bei Rollback
        } finally {
            session.endSession();
        }
        const filmDataSaved: FilmData = filmSaved.toObject(); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        logger.debug(
            `FilmService.create(): filmDataSaved=${JSON5.stringify(
                filmDataSaved,
            )}`,
        );

        await this.sendmail(filmDataSaved);

        return filmDataSaved;
    }

    async update(filmData: Film, versionStr: string) {
        if (this.mock !== undefined) {
            return this.mock.update(filmData);
        }

        logger.debug(
            `FilmService.update(): filmData=${JSON5.stringify(filmData)}`,
        );
        logger.debug(`FilmService.update(): versionStr=${versionStr}`);

        const validateResult = await this.validateUpdate(filmData, versionStr);
        if (validateResult instanceof FilmServiceError) {
            return validateResult;
        }

        // findByIdAndReplace ersetzt ein Document mit ggf. weniger Properties
        const film = new FilmModel(filmData);
        const updateOptions = { new: true };
        const result = await FilmModel.findByIdAndUpdate(
            film._id,
            film,
            updateOptions,
        ).lean<FilmData>();
        if (result === null) {
            return new FilmNotExists(film._id);
        }

        if (result.__v !== undefined) {
            result.__v++;
        }
        logger.debug(`FilmService.update(): result=${JSON5.stringify(result)}`);

        // Weitere Methoden von mongoose zum Aktualisieren:
        //    Film.findOneAndUpdate(update)
        //    film.update(bedingung)
        return Promise.resolve(result);
    }

    async delete(id: string) {
        if (this.mock !== undefined) {
            return this.mock.remove(id);
        }
        logger.debug(`FilmService.delete(): id=${id}`);

        // Den Film zur gegebenen ID asynchron loeschen
        const { deletedCount } = await FilmModel.deleteOne({ _id: id }); // eslint-disable-line @typescript-eslint/naming-convention
        logger.debug(`FilmService.delete(): deletedCount=${deletedCount}`);
        return deletedCount !== undefined;

        // Weitere Methoden von mongoose, um zu loeschen:
        //  Film.findByIdAndRemove(id)
        //  Film.findOneAndRemove(bedingung)
    }

    private async validateCreate(film: Film) {
        const msg = validateFilm(film);
        if (msg !== undefined) {
            logger.debug(
                `FilmService.validateCreate(): Validation Message: ${JSON5.stringify(
                    msg,
                )}`,
            );
            return new FilmInvalid(msg);
        }

        // statt 2 sequentiellen DB-Zugriffen waere 1 DB-Zugriff mit OR besser

        const resultTitel = await this.checkTitelExists(film);
        if (resultTitel !== undefined) {
            return resultTitel;
        }

        logger.debug('FilmService.validateCreate(): ok');
        return undefined;
    }

    private async checkTitelExists(film: Film) {
        const { titel } = film;

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const tmpId = await FilmModel.findOne({ titel }, { _id: true }).lean<
            string
        >();
        if (tmpId !== null) {
            logger.debug(
                `FilmService.checkTitelExists(): _id=${JSON5.stringify(tmpId)}`,
            );
            return new TitelExists(titel as string, tmpId);
        }

        logger.debug('FilmService.checkTitelExists(): ok');
        return undefined;
    }

    private async sendmail(filmData: FilmData) {
        if (serverConfig.cloud !== undefined) {
            // In der Cloud kann man z.B. "@sendgrid/mail" statt
            // "nodemailer" mit lokalem Mailserver verwenden
            return;
        }

        const from = '"SWE Team" <swe.team@acme.com>';
        const to = '"Bruce Wayne" <bruce.wayne@acme.com>';
        const subject = `Neuer Film ${filmData._id}`;
        const body = `Der Film namens <strong>${filmData.titel}</strong> ist angelegt`;

        const data: SendMailOptions = { from, to, subject, html: body };
        logger.debug(`sendMail(): data = ${JSON5.stringify(data)}`);

        try {
            const nodemailer = await import('nodemailer'); // eslint-disable-line node/no-unsupported-features/es-syntax
            await nodemailer.createTransport(mailConfig).sendMail(data);
        } catch (err: unknown) {
            logger.error(
                `FilmService.create(): Fehler beim Verschicken der Email: ${JSON5.stringify(
                    err,
                )}`,
            );
        }
    }

    private async validateUpdate(film: FilmData, versionStr: string) {
        const result = this.validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        logger.debug(`FilmService.validateUpdate(): version=${version}`);
        logger.debug(
            `FilmService.validateUpdate(): film=${JSON5.stringify(film)}`,
        );

        const validationMsg = validateFilm(film);
        if (validationMsg !== undefined) {
            return new FilmInvalid(validationMsg);
        }

        const resultTitel = await this.checkTitelExists(film);
        if (resultTitel !== undefined && resultTitel.id !== film._id) {
            return resultTitel;
        }

        const resultIdAndVersion = await this.checkIdAndVersion(
            film._id,
            version,
        );
        if (resultIdAndVersion !== undefined) {
            return resultIdAndVersion;
        }

        logger.debug('FilmService.validateUpdate(): ok');
        return undefined;
    }

    private validateVersion(versionStr: string | undefined) {
        if (versionStr === undefined) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                `FilmService.validateVersion(): VersionInvalid=${JSON5.stringify(
                    error,
                )}`,
            );
            return error;
        }

        const version = Number.parseInt(versionStr, 10);
        if (Number.isNaN(version)) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                `FilmService.validateVersion(): VersionInvalid=${JSON5.stringify(
                    error,
                )}`,
            );
            return error;
        }

        return version;
    }

    private async checkIdAndVersion(id: string | undefined, version: number) {
        const filmDb = await FilmModel.findById(id).lean<FilmData>();
        if (filmDb === null) {
            const result = new FilmNotExists(id);
            logger.debug(
                `FilmService.checkIdAndVersion(): FilmNotExists=${JSON5.stringify(
                    result,
                )}`,
            );
            return result;
        }

        const versionDb = filmDb.__v ?? 0;
        if (version < versionDb) {
            const result = new VersionOutdated(id as string, version);
            logger.debug(
                `FilmService.checkIdAndVersion(): VersionOutdated=${JSON5.stringify(
                    result,
                )}`,
            );
            return result;
        }

        return undefined;
    }
}

/* eslint-enable require-await, no-null/no-null, unicorn/no-useless-undefined */
/* eslint-enable max-lines */
