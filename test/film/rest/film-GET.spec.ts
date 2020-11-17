import { HttpStatus, serverConfig } from '../../../src/shared';
import { agent, createTestserver } from '../../testserver';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import type { AddressInfo } from 'net';
import { FilmData } from '../../../src/film/entity';
import { PATHS } from '../../../src/app';
import type { Server } from 'http';
import chai from 'chai';
import each from 'jest-each';
import fetch from 'node-fetch';

const { expect } = chai;

// IIFE (= Immediately Invoked Function Expression) statt top-level await
// https://developer.mozilla.org/en-US/docs/Glossary/IIFE
(async () => {
    // startWith(), endWith()
    const chaiString = await import('chai-string');
    chai.use(chaiString.default);
})();

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const titelVorhanden = ['a', 't', 'g'];
const titelNichtVorhanden = ['xx', 'yy'];
// const SprachenVorhanden = [Sprache.DEUTSCH, Sprache.ENGLISCH];
const SprachenNichtVorhanden = ['JAPANISCH', 'CHINESISCH'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
let server: Server;
const path = PATHS.filme;
let filmeUri: string;

// Test-Suite
describe('GET /filme', () => {
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        filmeUri = `https://${serverConfig.host}:${address.port}${path}`;
    });

    afterAll(() => server.close());

    test('Alle Filme', async () => {
        // given

        // when
        const response = await fetch(filmeUri, { agent });

        // then
        const { status, headers } = response;
        expect(status).to.be.equal(HttpStatus.OK);
        expect(headers.get('Content-Type')).to.match(/json/iu);
        // https://jestjs.io/docs/en/expect
        // JSON-Array mit mind. 1 JSON-Objekt
        const filme: Array<any> = await response.json();
        expect(filme).not.to.be.empty;
        filme.forEach((film) => {
            const selfLink = film._links.self.href;
            expect(selfLink).to.have.string(path);
        });
    });

    each(titelVorhanden).test(
        'Filme mit einem Titel, der "%s" enthaelt',
        async (teilTitel) => {
            // given
            const uri = `${filmeUri}?titel=${teilTitel}`;

            // when
            const response = await fetch(uri, { agent });

            // then
            const { status, headers } = response;
            expect(status).to.be.equal(HttpStatus.OK);
            expect(headers.get('Content-Type')).to.match(/json/iu);
            // JSON-Array mit mind. 1 JSON-Objekt
            const body = await response.json();
            expect(body).not.to.be.empty;

            // Jeder Film hat einen Titel mit dem Teilstring 'a'
            body.map((film: FilmData) => film.titel).forEach((titel: string) =>
                expect(titel.toLowerCase()).to.have.string(teilTitel),
            );
        },
    );

    each(titelNichtVorhanden).test(
        'Keine Filme mit einem Titel, der "%s" nicht enthaelt',
        async (teilTitel) => {
            // given
            const uri = `${filmeUri}?titel=${teilTitel}`;

            // when
            const response = await fetch(uri, { agent });

            // then
            expect(response.status).to.be.equal(HttpStatus.NOT_FOUND);
            const body = await response.text();
            expect(body).to.be.equalIgnoreCase('not found');
        },
    );

    //each(SprachenVorhanden).test(
    //  'Mind. 1 Film mit der Sprache "%s"',
    //async (sprache) => {
    // given
    //  const uri = `${filmeUri}?${sprache}=true`;

    // when
    //const response = await fetch(uri, { agent });

    // then
    //const { status} = response;
    //expect(status).to.be.equal(HttpStatus.NOT_FOUND);
    //expect(headers.get('Content-Type')).to.match(/json/iu);
    // JSON-Array mit mind. 1 JSON-Objekt
    //const body = await response.json();
    //expect(body).not.to.be.empty;

    // Jeder Film hat im Array der Kategorien "sci-fi"
    //body.map(
    //    (film: FilmData) => film.sprache,
    //).forEach((s: Array<string>) =>
    //    expect(s).to.include(sprache.toUpperCase()),
    //);
    //},
    //);

    each(SprachenNichtVorhanden).test(
        'Keine Filme mit der Sprache "%s"',
        async (sprache) => {
            // given
            const uri = `${filmeUri}?${sprache}=true`;

            // when
            const response = await fetch(uri, { agent });

            // then
            expect(response.status).to.be.equal(HttpStatus.NOT_FOUND);
            const body = await response.text();
            expect(body).to.be.equalIgnoreCase('not found');
        },
    );
});
