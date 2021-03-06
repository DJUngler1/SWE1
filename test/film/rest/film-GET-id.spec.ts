// Node enthaelt _NICHT_ die Funktion fetch() aus ES2015
// node-fetch implementiert die Funktion fetch() fuer Node:
// https://github.com/node-fetch/node-fetch
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

// Alternativen zu node-fetch: https://github.com/request/request/issues/3143
//  got         https://github.com/sindresorhus/got
//  axios       https://github.com/axios/axios, beinhaltet .d.ts
//  ky          https://github.com/sindresorhus/ky
//  superagent  https://github.com/visionmedia/superagent
//              ursprünglich von TJ Holowaychuk (-> Express, body-parser, compress, ...)
//  needle      https://github.com/tomas/needle

import { HttpStatus, serverConfig } from '../../../src/shared';
import { agent, createTestserver } from '../../testserver';
import { afterAll, beforeAll, describe } from '@jest/globals';
import fetch, { Headers, Request } from 'node-fetch';
import type { AddressInfo } from 'net';
import { PATHS } from '../../../src/app';
import type { Server } from 'http';
import chai from 'chai';
import each from 'jest-each';

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
const idVorhanden = [
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
];
const idNichtVorhanden = [
    '00000000-0000-0000-0000-000000000888',
    '00000000-0000-0000-0000-000000000999',
];
const idVorhandenETag = [
    ['00000000-0000-0000-0000-000000000001', '"0"'],
    ['00000000-0000-0000-0000-000000000002', '"0"'],
];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
let server: Server;
const path = PATHS.filme;
let filmeUri: string;

// Test-Suite
describe('GET /filme/:id', () => {
    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        filmeUri = `https://${serverConfig.host}:${address.port}${path}`;
    });

    afterAll(() => server.close());

    each(idVorhanden).test('Film zu vorhandener ID %s', async (id) => {
        // given
        const uri = `${filmeUri}/${id}`;

        // when
        const response = await fetch(uri, { agent });

        // then
        const { status, headers } = response;
        expect(status).to.be.equal(HttpStatus.OK);
        expect(headers.get('Content-Type')).to.match(/json/iu);
        // im Response-Body ist ist ein JSON-Objekt mit Atom-Links
        const body = await response.json();
        expect(body._links.self.href).to.endWith(`${path}/${id}`);
    });

    each(idNichtVorhanden).test(
        'Kein Film zu nicht-vorhandener ID %s',
        async (id) => {
            // given
            const uri = `${filmeUri}/${id}`;

            // when
            const response = await fetch(uri, { agent });

            // then
            expect(response.status).to.be.equal(HttpStatus.NOT_FOUND);
            const body = await response.text();
            expect(body).to.be.equalIgnoreCase('not found');
        },
    );

    each(idVorhandenETag).test(
        'Film zu vorhandener ID %s mit ETag %s',
        async (id, etag) => {
            // given
            const uri = `${filmeUri}/${id}`;
            const headers = new Headers({ 'If-None-Match': etag });
            const request = new Request(uri, { headers, agent });

            // when
            const response = await fetch(request);

            // then
            const { status, size } = response;
            expect(status).to.be.equal(HttpStatus.NOT_MODIFIED);
            expect(size).to.be.equal(0);
        },
    );
});
