/* eslint-disable @typescript-eslint/naming-convention */

// id,
// titel,
// regisseur,
// datum,
// kategorien,
// sprache,
// hauptdarsteller,
// dauer

export const filme = [
    {
        _id: '00000000-0000-0000-0000-000000000001',
        titel: 'Django Unchained',
        regisseur: {
            nachname: 'Terentino',
            vorname: 'Quentin',
        },
        kategorien: ['action', 'romance'],
        sprache: 'DEUTSCH',
        datum: new Date('2013-01-17'),
        hauptdarsteller: {
            nachname: 'Foxx',
            vorname: 'Jamie',
        },
        dauer: 165,
        homepage: 'https://acme.com/',
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '00000000-0000-0000-0000-000000000002',
        titel: 'Matrix',
        regisseur: [
            {
                nachname: 'Wachowski',
                vorname: 'Lilly',
            },
            {
                nachname: 'Wachowski',
                vorname: 'Lana',
            },
        ],
        kategorien: ['action', 'sci-fi', 'fantasy'],
        sprache: 'FRANZOESISCH',
        datum: new Date('1999-06-17'),
        hauptdarsteller: {
            nachname: 'Reeves',
            vorname: 'Keanue',
        },
        dauer: 150,
        homepage: 'https://acme.com/',
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '00000000-0000-0000-0000-000000000003',
        titel: 'Inception',
        regisseur: {
            nachname: 'Nolan',
            vorname: 'Christopher',
        },
        kategorien: ['thriller', 'sci-fi'],
        sprache: 'ENGLISCH',
        datum: new Date('2010-07-29'),
        hauptdarsteller: {
            nachname: 'DiCaprio',
            vorname: 'Leonardo',
        },
        dauer: 302,
        homepage: 'https://acme.com/',
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '00000000-0000-0000-0000-000000000004',
        titel: 'Star Trek: First Contact',
        regisseur: {
            nachname: 'Frakes',
            vorname: 'Jonathan',
        },
        kategorien: ['Sci-fi', 'Action'],
        sprache: 'ENGLISCH',
        datum: new Date('2010-07-29'),
        hauptdarsteller: {
            nachname: 'Stewart',
            vorname: 'Patrick',
        },
        dauer: 111,
        homepage: 'https://acme.com/',
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '00000000-0000-0000-0000-000000000005',
        titel: 'The Devil Wears Prada',
        regisseur: {
            nachname: 'David',
            vorname: 'Frankel',
        },
        kategorien: ['Drama', 'Comedy'],
        sprache: 'ENGLISCH',
        datum: new Date('2006-10-12'),
        hauptdarsteller: {
            nachname: 'Streep',
            vorname: 'Meryl',
        },
        dauer: 110,
        homepage: 'https://acme.com/',
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

/* eslint-enable @typescript-eslint/naming-convention */
