import type { Film } from './film';
import JSON5 from 'json5';
import { logger } from '../../shared';
import validator from 'validator';

const { isISO8601, isURL } = validator;

// id,
// titel,
// regisseur,
// datum,
// kategorien,
// sprache,
// hauptdarsteller,
// dauer

export interface ValidationErrorMsg {
    id?: string;
    titel?: string;
    datum?: string;
    art?: string;
    sprache?: string;
    homepage?: string;
}
/* eslint-disable no-null/no-null */
export const validateFilm = (film: Film) => {
    const err: ValidationErrorMsg = {};
    const { titel, datum, sprache, homepage } = film;

    if (titel === undefined || titel === null || titel === '') {
        err.titel = 'Ein Buch muss einen Titel haben.';
    } else if (!/^\w.*/u.test(titel)) {
        err.titel =
            'Ein Buchtitel muss mit einem Buchstaben, einer Ziffer oder _ beginnen.';
    }

    if (sprache === undefined || sprache === null || sprache === '') {
        err.sprache = 'Die Sprache eines Films muss gesetzt sein';
    } else if (
        (sprache as unknown) !== 'DEUTSCH' &&
        (sprache as unknown) !== 'ENGLISCH' &&
        (sprache as unknown) !== 'FRANZÖSISCH'
    ) {
        err.sprache =
            'Die Sprache eines Buches muss DETUSCH oder ENGLISCH oder FRANZÖSISCH sein.';
    }

    if (typeof datum === 'string' && !isISO8601(datum)) {
        err.datum = `'${datum}' ist kein gueltiges Datum (yyyy-MM-dd).`;
    }

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
/* eslint-enable no-null/no-null */
