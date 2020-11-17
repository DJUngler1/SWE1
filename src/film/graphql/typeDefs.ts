/**
 * Typdefinitionen fuer GraphQL:
 *  Vordefinierte skalare Typen
 *      Int: 32‐bit Integer
 *      Float: Gleitkommmazahl mit doppelter Genauigkeit
 *      String:
 *      Boolean: true, false
 *      ID: eindeutiger Bezeichner, wird serialisiert wie ein String
 *  Buch: eigene Typdefinition für Queries
 *        "!" markiert Pflichtfelder
 *  Query: Signatur der Lese-Methoden
 *  Mutation: Signatur der Schreib-Methoden
 */

import { gql } from 'apollo-server-express';

// https://www.apollographql.com/docs/apollo-server/migration-two-dot/#the-gql-tag
// https://www.apollographql.com/docs/apollo-server/schema/schema

// "Tagged Template String", d.h. der Template-String wird durch eine Funktion
// (hier: gql) modifiziert. Die Funktion gql wird fuer Syntax-Highlighting und
// fuer die Formatierung durch Prettier verwendet.
export const typeDefs = gql`
    "Enum-Typ fuer die Art eines Buches"
    enum Sprache {
        DEUTSCH
        ENGLISCH
        FRANZOESISCH
    }

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

    "Datenschema eines Filmes, der empfangen oder gesendet wird"
    type Film {
        id: ID!
        version: Int
        titel: String!
        regisseur: String
        datum: String
        kategorien: [String]
        sprache: Sprache
        hauptdarsteller: String
        dauer: Int
        homepage: String
    }

    "Funktionen, um Filme zu empfangen"
    type Query {
        filme(titel: String): [Film]
        film(id: ID!): Film
    }

    "Funktionen, um Filme anzulegen, zu aktualisieren oder zu loeschen"
    type Mutation {
        createFilm(
            titel: String!
            regisseur: String
            datum: String
            kategorien: [String]
            sprache: Sprache
            hauptdarsteller: String
            dauer: Int
            homepage: String
        ): Film
        updateBuch(
            id: ID!
            version: Int
            titel: String!
            regisseur: String
            datum: String
            kategorien: [String]
            sprache: Sprache
            hauptdarsteller: String
            dauer: Int
            homepage: String
        ): Buch
        deleteBuch(id: ID!): Boolean
    }
`;
