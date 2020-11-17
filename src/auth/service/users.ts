import type { User } from './user.service';
import dotenv from 'dotenv';

dotenv.config();
const { env } = process;
const { USER_PASSWORD_ENCODED } = env;
const password = USER_PASSWORD_ENCODED as string;

// NICHT: Set statt [], weil es fuer Set keine Suchfunktion gibt
export const users: User[] = [
    {
        id: '10000000-0000-0000-0000-000000000001',
        username: 'admin',
        password,
        email: 'admin@acme.com',
        roles: ['admin', 'mitarbeiter', 'abteilungsleiter', 'kunde'],
    },
    {
        id: '10000000-0000-0000-0000-000000000002',
        username: 'tobias.hnyk',
        password,
        email: 'tobias.hnyk@acme.com',
        roles: ['admin', 'mitarbeiter', 'kunde'],
    },
    {
        id: '10000000-0000-0000-0000-000000000003',
        username: 'lisa.maus',
        password,
        email: 'lisa.maus@acme.com',
        roles: ['mitarbeiter', 'kunde'],
    },
    {
        id: '10000000-0000-0000-0000-000000000004',
        username: 'felix.krauss',
        password,
        email: 'felix.krauss@acme.com',
        roles: ['mitarbeiter', 'kunde'],
    },
    {
        id: '10000000-0000-0000-0000-000000000005',
        username: 'michael.schmidt',
        password,
        email: 'michael.scmidt@acme.com',
        roles: ['kunde'],
    },
    {
        id: '10000000-0000-0000-0000-000000000006',
        username: 'lukas.mueller',
        password,
        email: 'lukas.mueller@acme.com',
    },
];
