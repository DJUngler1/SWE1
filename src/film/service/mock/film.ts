/*
 * Copyright (C) 2018 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { FilmArt, Verlag } from './../../entity';
import type { FilmData } from './../../entity';
import { Sprache } from '../../entity/film';

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
