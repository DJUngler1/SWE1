import { Sprache } from '../../../src/film/entity';
import { HttpMethod, agent, createTestserver } from '../../testserver';
import { HttpStatus, logger, serverConfig } from '../../../src/shared';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import fetch, { Headers, Request } from 'node-fetch';
import type { AddressInfo } from 'net';
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
const geaenderterFilm: object = {
    titel: 'Star Trek: Geaendert',
    regisseur: {nachname: 'Frakes',vorname: 'Jonathan',},
    kategorien: ['sci-fi', 'action'],
    sprache: 'ENGLISCH',
    datum: new Date('2010-07-29'),
    hauptdarsteller: {nachname: 'Stewart',vorname: 'Patrick',},
    dauer: 111,
    homepage: 'https://acme.com/',
};
const idVorhanden = '00000000-0000-0000-0000-000000000004';

const geaenderterFilmIdNichtVorhanden: object = {
    titel: 'Star Trek: Geaendert',
    regisseur: {nachname: 'Frakes',vorname: 'Jonathan',},
    kategorien: ['sci-fi', 'action'],
    sprache: 'ENGLISCH',
    datum: new Date('2010-07-29'),
    hauptdarsteller: {nachname: 'Stewart',vorname: 'Patrick',},
    dauer: 111,
    homepage: 'https://acme.com/',
};
const idNichtVorhanden = '00000000-0000-0000-0000-000000000999';

const geaenderterFilmInvalid: object = {
    titel: 'Blabla',
    regisseur: [{ nachname: 'Test', vorname: 'Theo' }],
    datum: '12345-123-123',
    kategorien: [],
    sprache: 'JAPANISCH',
    hauptdarsteller: [{ nachname: 'Test', vorname: 'Schauspieler' }],
    dauer: -100,
};

const veralterFilm: object = {
    titel: 'Veraltet',
    regisseur: {nachname: 'Frakes',vorname: 'Jonathan',},
    kategorien: ['sci-fi', 'action'],
    sprache: Sprache.ENGLISCH,
    datum: new Date('2010-07-29'),
    hauptdarsteller: {nachname: 'Stewart',vorname: 'Patrick',},
    dauer: 111,
    homepage: 'https://acme.com/',
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
const path = PATHS.filme;
let server: Server;
let filmeUri: string;
let loginUri: string;

// Test-Suite
describe('PUT /filme/:id', () => {
    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        const baseUri = `https://${serverConfig.host}:${address.port}`;
        filmeUri = `${baseUri}${path}`;
        logger.info(`filmeUri = ${filmeUri}`);
        loginUri = `${baseUri}${PATHS.login}`;
    });

    afterAll(() => server.close());

    test('Vorhandenen Film aendern', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaenderterFilm);
        const request = new Request(`${filmeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.NO_CONTENT);
        const responseBody = await response.text();
        expect(responseBody).to.be.empty;
    });

    test('Nicht-vorhandenen Film aendern', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaenderterFilmIdNichtVorhanden);
        const request = new Request(`${filmeUri}/${idNichtVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.PRECONDITION_FAILED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equal(
            `Es gibt kein Film mit der ID "${idNichtVorhanden}".`,
        );
    });

    test('Vorhandenes Film aendern, aber mit ungueltigen Daten', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaenderterFilmInvalid);
        const request = new Request(`${filmeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST);
        const { sprache, datum } = await response.json();
        expect(sprache).to.be.equal(
            'Die Sprache eines Films muss DEUTSCH oder ENGLISCH oder FRANZOESISCH sein.',
        );
        expect(datum).to.contain('ist kein gueltiges Datum');
    });

    test('Vorhandenen Film aendern, aber ohne Versionsnummer', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(geaenderterFilm);
        const request = new Request(`${filmeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.PRECONDITION_REQUIRED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equal('Versionsnummer fehlt');
    });

    test('Vorhandenen Film aendern, aber mit alter Versionsnummer', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"-1"',
        });
        const body = JSON.stringify(veralterFilm);
        const request = new Request(`${filmeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.PRECONDITION_FAILED);
        const responseBody = await response.text();
        expect(responseBody).to.have.string('Die Versionsnummer');
    });

    test('Vorhandenes Film aendern, aber ohne Token', async () => {
        // given
        const headers = new Headers({
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaenderterFilm);
        const request = new Request(`${filmeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
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

    test('Vorhandenen Film aendern, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaenderterFilm);
        const request = new Request(`${filmeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
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
});
