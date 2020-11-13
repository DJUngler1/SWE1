

import { MAX_RATING, logger } from '../../shared';
import type { Film } from './film';
import JSON5 from 'json5';
import validator from 'validator';

const { isISBN, isISO8601, isURL } = validator;

export interface ValidationErrorMsg {
    id?: string;
    titel?: string;
    regisseur?: string;
    datum: string;
    kategorien?: string;
    sprache: string;
    hauptdarsteller: string;
    dauer: string;
}

/* eslint-disable max-lines-per-function, no-null/no-null */
export const validateFilm = (film: Film) => {
    const err: ValidationErrorMsg = {};
    const { titel, regisseur, datum, kategorien, sprache, hauptdarsteller, dauer } = film;

    if (titel === undefined || titel === null || titel === '') {
        err.titel = 'Ein Film muss einen Titel haben.';
    } else if (!/^\w.*/u.test(titel)) {
        err.titel =
            'Ein Filmtitel muss mit einem Buchstaben, einer Ziffer oder _ beginnen.';
    }

    if (regisseur === undefined || regisseur === null || regisseur === '') {
        err.regisseur = 'Die Art eines Buches muss gesetzt sein';
    } else if (
        (regisseur as unknown) !== 'KINDLE' &&
        (regisseur as unknown) !== 'DRUCKAUSGABE'
    ) {
        err.regisseur = 'Die Art eines Buches muss KINDLE oder DRUCKAUSGABE sein.';
    }

    if (typeof datum === 'string' && !isISO8601(datum)) {
        err.datum = `'${datum}' ist kein gueltiges Datum (yyyy-MM-dd).`;
    }

    if (verlag === undefined || verlag === null || verlag === '') {
        err.verlag = 'Der Verlag des Buches muss gesetzt sein.';
    } else if (
        (verlag as unknown) !== 'FOO_VERLAG' &&
        (verlag as unknown) !== 'BAR_VERLAG'
    ) {
        err.verlag =
            'Der Verlag eines Buches muss FOO_VERLAG oder BAR_VERLAG sein.';
    }

    if (typeof datum === 'string' && !isISO8601(datum)) {
        err.datum = `'${datum}' ist kein gueltiges Datum (yyyy-MM-dd).`;
    }

    if (
        isbn !== undefined &&
        isbn !== null &&
        (typeof isbn !== 'string' || !isISBN(isbn))
    ) {
        err.isbn = `'${isbn}' ist keine gueltige ISBN-Nummer.`;
    }

    // Falls "preis" ein string ist: Pruefung z.B. 12.30
    // if (isPresent(preis) && !isCurrency(`${preis}`)) {
    //     err.preis = `${preis} ist kein gueltiger Preis`
    // }
    if (
        homepage !== undefined &&
        homepage !== null &&
        (typeof homepage !== 'string' || !isURL(homepage))
    ) {
        err.homepage = `'${homepage}' ist keine gueltige URL.`;
    }

    logger.debug(`validateBuch: err=${JSON5.stringify(err)}`);
    return Object.entries(err).length === 0 ? undefined : err;
};
/* eslint-enable max-lines-per-function, no-null/no-null */
