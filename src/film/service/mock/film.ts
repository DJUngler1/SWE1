import type { FilmData } from '../../entity';
import { Sprache } from '../../entity';

/* eslint-disable @typescript-eslint/naming-convention */

export const film: FilmData = {
    _id: '00000000-0000-0000-0000-000000000001',
    titel: 'Inception',
    regisseur: 'Christopher Nolan',
    datum: new Date('2010-11-11'),
    kategorien: ['sci-fi'],
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
    homepage: 'https://acme.com/',
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
        datum: new Date('1999-11-11'),
        kategorien: ['Psychothriller'],
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
        homepage: 'https://acme.com/',
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
    },
];

/* eslint-enable @typescript-eslint/naming-convention */
