import { FilmArt, Verlag } from '../../entity';
import type { FilmData } from '../../entity';
import { Sprache } from '../../entity';

/* eslint-disable @typescript-eslint/naming-convention */

export const film: FilmData = {
    _id: '00000000-0000-0000-0000-000000000001',
    titel: 'Inception',
    regisseur: 'Christopher Nolan',
    datum: 2010,
    kategorien: 'Science-Fiction',
    sprache: Sprache.ENGLISCH,
    hauptdarsteller: [
        {
            nachname: 'DiCaprio',
            vorname: 'Leonardo',
        },
        {
            nachname: 'Cotillard',
            vorname: 'Marion',
        },
    ],
    dauer: 148,
    __v: 0,
    createdAt: 0,
    updatedAt: 0,
};

export const filme: FilmData[] = [
    film,
    {
        _id: '00000000-0000-0000-0000-000000000002',
        titel: 'Fight Club',
        regisseur: 'David Fincher',
        datum: 1999,
        kategorien: 'Psychothriller',
        sprache: Sprache.ENGLISCH,
        hauptdarsteller: [
            {
                nachname: 'Norton',
                vorname: 'Edward',
            },
            {
                nachname: 'Pitt',
                vorname: 'Brad',
            },
        ],
        dauer: 139,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
    },
];

/* eslint-enable @typescript-eslint/naming-convention */
