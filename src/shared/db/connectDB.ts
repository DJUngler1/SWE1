/* eslint-disable no-process-exit */
import { connect, connection, pluralize } from 'mongoose';
import type { ConnectionOptions } from 'mongoose';
import JSON5 from 'json5';
import type { Schema } from 'mongoose';
import { dbConfig } from '../config';
import { logger } from '../logger';

// http://mongoosejs.com/docs/connections.html
// https://github.com/mongodb/node-mongodb-native
// https://docs.mongodb.com/manual/tutorial/configure-ssl-clients

const { atlas, url, tls, tlsCertificateKeyFile, mockDB } = dbConfig;
const useNewUrlParser = true;
const useFindAndModify = false;
const useCreateIndex = true;
const useUnifiedTopology = true;

// Name eines mongoose-Models = Name der Collection
pluralize(undefined); // eslint-disable-line unicorn/no-useless-undefined

// Callback: Start des Appservers, nachdem der DB-Server gestartet ist

export const connectDB = async () => {
    if (mockDB) {
        logger.warn('Mocking: Keine DB-Verbindung');
        return;
    }

    logger.info(
        `URL fuer mongoose: ${url
            .replace(/\/\/.*:/u, '//USERNAME:@')
            .replace(/:[^:]*@/u, ':***@')}`,
    );

    // Optionale Einstellungen, die nicht im Connection-String verwendbar sind
    // http://mongoosejs.com/docs/connections.html
    // http://mongodb.github.io/node-mongodb-native/3.5/api/MongoClient.html#.connect
    // https://mongodb.github.io/node-mongodb-native/3.5/reference/connecting/connection-settings
    const options: ConnectionOptions = {
        useNewUrlParser,
        useFindAndModify,
        useCreateIndex,
        useUnifiedTopology,
    };
    if (!atlas && !tls) {
        options.tls = true;
        options.tlsCertificateKeyFile = tlsCertificateKeyFile;
        options.tlsInsecure = true;
    }

    // http://mongoosejs.com/docs/api.html#index_Mongoose-createConnection
    // http://mongoosejs.com/docs/api.html#connection_Connection-open
    // http://mongoosejs.com/docs/connections.html
    // https://docs.mongodb.com/manual/reference/connection-string/#connections-connection-options
    // http://mongodb.github.io/node-mongodb-native/3.5/api/MongoClient.html
    try {
        await connect(url, options);
    } catch (err: any) {
        logger.error(`${JSON5.stringify(err)}`);
        logger.error(
            `FEHLER beim Aufbau der DB-Verbindung: ${err.message as string}\n`,
        );
        process.exit(0); // eslint-disable-line node/no-process-exit
    }

    logger.info(`DB-Verbindung zu ${connection.db.databaseName} ist aufgebaut`);

    // util.promisify(fn) funktioniert nur mit Funktionen, bei denen
    // der error-Callback das erste Funktionsargument ist
    connection.on('disconnecting', () =>
        logger.info('DB-Verbindung wird geschlossen...'),
    );
    connection.on('disconnected', () =>
        logger.info('DB-Verbindung ist geschlossen.'),
    );
    connection.on('error', () => logger.error('Fehlerhafte DB-Verbindung'));
};

// In Produktion auf false setzen
export const autoIndex = true;

export const optimistic = (schema: Schema) => {
    // https://mongoosejs.com/docs/guide.html#versionKey
    // https://github.com/Automattic/mongoose/issues/1265
    schema.pre('findOneAndUpdate', function () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-invalid-this
        const update = this.getUpdate();
        // eslint-disable-next-line no-null/no-null
        if (update.__v !== null) {
            delete update.__v;
        }
        const keys = ['$set', '$setOnInsert'];
        for (const key of keys) {
            // Optional Chaining
            /* eslint-disable security/detect-object-injection */
            // eslint-disable-next-line no-null/no-null
            if (update[key]?.__v !== null) {
                delete update[key].__v;
                if (Object.entries(update[key]).length === 0) {
                    delete update[key]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
                }
            }
            /* eslint-enable security/detect-object-injection */
        }
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-assignment
        update.$inc = update.$inc || {};
        update.$inc.__v = 1;
    });
};

/* eslint-enable no-process-exit */
