import { Sprache } from '../../../src/film/entity';
import { HttpMethod, agent, createTestserver } from '../../testserver';
import { HttpStatus, serverConfig, uuidRegexp } from '../../../src/shared';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import fetch, { Headers, Request } from 'node-fetch';
import type { AddressInfo } from 'net';
import type { Film } from '../../../src/film/entity';
import { PATHS } from '../../../src/app';
import type { Server } from 'http';
import chai from 'chai';
import { login } from '../../login';

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
const neuerFilm: Film = {
    titel: 'Neu',
    regisseur: [{ nachname: 'Test', vorname: 'Theo' }],
    datum: '2016-02-28',
    kategorien: ['sci-fi', 'comedy'],
    sprache: Sprache.DEUTSCH,
    hauptdarsteller: [{ nachname: 'Test', vorname: 'Schauspieler' }],
    dauer: 133,
    homepage: 'https://test.de/',
};
const neuerFilmInvalid: object = {
    titel: 'Blabla',
    regisseur: [{ nachname: 'Test', vorname: 'Theo' }],
    datum: '12345-123-123',
    kategorien: [],
    sprache: 'JAPANISCH',
    hauptdarsteller: [{ nachname: 'Test', vorname: 'Schauspieler' }],
    dauer: -100,
};
const neuerFilmTitelExistiert: Film = {
    titel: 'Django Unchained',
    regisseur: [{ nachname: 'Test', vorname: 'Theo' }],
    datum: '2016-02-28',
    kategorien: ['sci-fi', 'comedy'],
    sprache: Sprache.DEUTSCH,
    hauptdarsteller: [{ nachname: 'Test', vorname: 'Schauspieler' }],
    dauer: 133,
    homepage: 'https://test.de/',
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
let server: Server;
const path = PATHS.filme;
let filmeUri: string;
let loginUri: string;

// Test-Suite
describe('POST /filme', () => {
    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        const baseUri = `https://${serverConfig.host}:${address.port}`;
        filmeUri = `${baseUri}${path}`;
        loginUri = `${baseUri}${PATHS.login}`;
    });

    afterAll(() => server.close());

    test('Neuer Film', async () => {
        // given
        const token = await login(loginUri);

        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuerFilm);
        const request = new Request(filmeUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        const { status } = response;
        expect(status).to.be.equal(HttpStatus.CREATED);

        const location = response.headers.get('Location');
        expect(location).to.exist;
        expect(typeof location === 'string').to.be.true;
        expect(location).not.to.be.empty;

        // UUID: Muster von HEX-Ziffern
        const indexLastSlash: number = location?.lastIndexOf('/') as number;
        const idStr = location?.slice(indexLastSlash + 1);
        expect(idStr).not.to.be.empty;
        expect(uuidRegexp.test(idStr as string)).to.be.true;

        const responseBody = response.text();
        expect(responseBody).to.be.empty;
    });

    test('Neuer Film mit ungueltigen Daten', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuerFilmInvalid);
        const request = new Request(filmeUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST);
        const { art, rating, verlag, datum, isbn } = await response.json();

        expect(art).to.be.equal(
            'Die Art eines Filmes muss KINDLE oder DRUCKAUSGABE sein.',
        );
        expect(rating).to.endWith('eine gueltige Bewertung.');
        expect(verlag).to.be.equal(
            'Der Verlag eines Filmes muss FOO_VERLAG oder BAR_VERLAG sein.',
        );
        expect(datum).to.contain('ist kein gueltiges Datum');
        expect(isbn).to.endWith('eine gueltige ISBN-Nummer.');
    });

    test('Neuer Film, aber der Titel existiert bereits', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuerFilmTitelExistiert);
        const request = new Request(filmeUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST);
        const responseBody = await response.text();
        expect(responseBody).has.string('Titel');
    });

    test('Neuer Film, aber ohne Token', async () => {
        // given
        const headers = new Headers({ 'Content-Type': 'application/json' });
        const body = JSON.stringify(neuerFilmTitelExistiert);
        const request = new Request(filmeUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.UNAUTHORIZED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equalIgnoreCase('unauthorized');
    });

    test('Neuer Film, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuerFilm);
        const request = new Request(filmeUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.UNAUTHORIZED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equalIgnoreCase('unauthorized');
    });

    test.todo('Test mit abgelaufenem Token');
});
