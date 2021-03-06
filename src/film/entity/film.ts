// id,
// titel,
// regisseur,
// datum,
// kategorien,
// sprache,
// hauptdarsteller,
// dauer

export enum Sprache {
    DEUTSCH = 'DEUTSCH',
    ENGLISCH = 'ENGLISCH',
    FRANZOESISCH = 'FRANZOESISCH',
}

// gemeinsames Basis-Interface fuer REST und GraphQL
export interface Film {
    _id?: string; // eslint-disable-line @typescript-eslint/naming-convention
    __v?: number; // eslint-disable-line @typescript-eslint/naming-convention
    titel: string | undefined | null;
    regisseur: unknown;
    datum: string | Date | undefined;
    kategorien?: string[];
    sprache: Sprache | '' | undefined | null;
    hauptdarsteller: unknown;
    dauer: number;
    homepage: string | undefined | null;
}

export interface FilmData extends Film {
    createdAt?: number;
    updatedAt?: number;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links?: {
        self?: { href: string };
        list?: { href: string };
        add?: { href: string };
        update?: { href: string };
        remove?: { href: string };
    };
}
