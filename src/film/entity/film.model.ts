import { Schema, model, set } from 'mongoose';
import { autoIndex, optimistic } from '../../shared';
import { v4 as uuid } from 'uuid';

// Eine Collection in MongoDB besteht aus Dokumenten im BSON-Format

set('debug', true);

// id,
// titel,
// regisseur,
// datum,
// kategorien,
// sprache,
// hauptdarsteller,
// dauer

export const filmSchema = new Schema(
    {
        _id: { type: String, default: uuid }, // eslint-disable-line @typescript-eslint/naming-convention
        titel: { type: String, required: true, unique: true },
        regisseur: [Schema.Types.Mixed],
        datum: Date,
        kategorien: { type: [String], sparse: true },
        sprache: {
            type: String,
            required: true,
            enum: ['DEUTSCH', 'ENGLISCH', 'FRANZÖSISCH'],
        },
        hauptdarsteller: [Schema.Types.Mixed],
    },
    {
        // createdAt und updatedAt als automatisch gepflegte Felder
        timestamps: true,
        // http://thecodebarbarian.com/whats-new-in-mongoose-5-10-optimistic-concurrency.html
        // @ts-expect-error optimisticConcurrency ab 5.10, @types/mongoose ist fuer 5.7
        optimisticConcurrency: true,
        autoIndex,
    },
);

// Optimistische Synchronisation durch das Feld __v fuer die Versionsnummer
filmSchema.plugin(optimistic);

// Methoden zum Schema hinzufuegen, damit sie spaeter beim Model (s.u.)
// verfuegbar sind, was aber bei buch.check() zu eines TS-Syntaxfehler fuehrt:
// schema.methods.check = () => {...}
// schema.statics.findByTitel =
//     (titel: string, cb: Function) =>
//         return this.find({titel: titel}, cb)

export const FilmModel = model('Film', filmSchema); // eslint-disable-line @typescript-eslint/naming-convention
