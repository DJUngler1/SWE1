// TODO: Express komplett
import {
    MAX_REQUESTS_PER_WINDOW,
    WINDOW_SIZE,
    // internalError,
    // logRequestHeader,
    // notFound,
    // notYetImplemented,
    // responseTimeFn,
    serverConfig,
    // validateContentType,
    // validateUUID,
} from './shared';

// Einlesen von application/json im Request-Rumpf
// Fuer multimediale Daten (Videos, Bilder, Audios): raw-body
// import { resolvers, typeDefs } from './buch/graphql';
import type { Options } from 'express-rate-limit';
import bearerToken from 'express-bearer-token';
import compression from 'compression';
import express from 'express';
// import { helmetHandlers } from './security';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// const { Router } = express; // eslint-disable-line @typescript-eslint/naming-convention

const rateLimitOptions: Options = {
    // z.B. 15 Minuten als Zeitfenster (Ms = Millisekunden)
    windowMs: WINDOW_SIZE,
    // z.B. max 100 requests/IP in einem Zeitfenster
    max: MAX_REQUESTS_PER_WINDOW,
};
const limiter = rateLimit(rateLimitOptions);

// hochgeladene Dateien als Buffer im Hauptspeicher halten
// const storage = multer.memoryStorage()
// const uploader = multer({storage})

const apiPath = '/api';
export const PATHS = {
    buecher: `${apiPath}/buecher`,
    verlage: `${apiPath}/verlage`,
    login: `${apiPath}/login`,
    graphql: '/graphql',
    html: '/html',
};

// Express als Middleware = anwendungsneutrale Dienste-/Zwischenschicht,
// d.h. Vermittler zwischen Request und Response.
// Alternativen zu Express (hat die hoechsten Download-Zahlen):
// * Hapi: von Walmart
// * Restify
// * Koa: von den urspruengl. Express-Entwicklern
// * Sails: baut auf Express auf, Waterline als ORM
// * Kraken: baut auf Express auf
//           von PayPal
//           verwaltet von der Node.js Foundation
//           genutzt von Oracle mit Oracle JET

class App {
    // Das App- bzw. Express-Objekt ist zustaendig fuer:
    //  * Konfiguration der Middleware
    //  * Routing
    // http://expressjs.com/en/api.html
    readonly app = express();

    constructor() {
        this.config();
        // this.routes();
    }

    private config() {
        if (serverConfig.dev) {
            // Logging der eingehenden Requests in der Console
            this.app.use(
                morgan('dev'),
                // Protokollierung der Response Time
                // responseTime(responseTimeFn),
                // Protokollierung des eingehenden Request-Headers
                // logRequestHeader,
            );
        }

        this.app.use(
            bearerToken(),

            // Spread Operator ab ES 2015
            // ...helmetHandlers,

            // falls CORS fuer die Webanwendung notwendig ist:
            // corsHandler,

            // GZIP-Komprimierung implizit unterstuetzt durch Chrome, FF, ...
            //   Accept-Encoding: gzip
            // Alternative: z.B. nginx als Proxy-Server und dort komprimieren
            compression(),
            limiter,
        );
    }
}

// private routes() {
//     this.buecherRoutes();
//     this.verlagRoutes();
//     this.loginRoutes();
//     this.buchGraphqlRoutes();
//     this.htmlRoutes();

//     // this.app.get('*', notFound);
//     // this.app.use(internalError);
// }

//     private buecherRoutes() {
//         // vgl: Spring WebFlux.fn
//         // https://expressjs.com/en/api.html#router
//         // Beispiele fuer "Middleware" bei Express:
//         //  * Authentifizierung und Autorisierung
//         //  * Rumpf bei POST- und PUT-Requests einlesen
//         //  * Logging, z.B. von Requests
//         //  * Aufruf der naechsten Middleware-Funktion
//         // d.h. "Middleware" ist eine Variation der Patterns
//         //  * Filter (Interceptoren) und
//         //  * Chain of Responsibility
//         // Ausblick zu Express 5 (z.Zt. noch als Alpha-Release):
//         //  * Router als eigenes Modul https://github.com/pillarjs/router
//         //  * Zusaetzliche Syntax beim Routing
//         //  * Promises statt Callbacks
//         //  * Verbesserte Handhabung von Query Strings
//         //  * noch keine .d.ts-Datei
//         const router = Router(); // eslint-disable-line new-cap
//         router
//             .route('/')
//             // https://expressjs.com/en/api.html#app.get.method
//             .get(find)
//             .post(
//                 validateJwt,
//                 validateContentType,
//                 isAdminMitarbeiter,
//                 json(),
//                 create,
//             );

//         const idParam = 'id';
//         router
//             .param(idParam, validateUUID)
//             .get(`/:${idParam}`, findById)
//             .put(
//                 `/:${idParam}`,
//                 validateJwt,
//                 validateContentType,
//                 isAdminMitarbeiter,
//                 json(),
//                 update,
//             )
//             .delete(`/:${idParam}`, validateJwt, isAdmin, deleteFn)
//             .put(`/:${idParam}/file`, validateJwt, isAdminMitarbeiter, upload)
//             .get(`/:${idParam}/file`, download);

//         this.app.use(PATHS.buecher, router);
//     }

//     private verlagRoutes() {
//         const router = Router(); // eslint-disable-line new-cap
//         router.get('/', notYetImplemented);
//         this.app.use(PATHS.verlage, router);
//     }

//     private loginRoutes() {
//         const router = Router(); // eslint-disable-line new-cap
//         router.route('/').post(
//             urlencoded({
//                 extended: false,
//                 type: 'application/x-www-form-urlencoded',
//             }),
//             login,
//         );
//         this.app.use(PATHS.login, router);
//     }

//     private buchGraphqlRoutes() {
//         const { playground } = serverConfig;
//         // https://www.apollographql.com/docs/apollo-server/data/resolvers/#passing-resolvers-to-apollo-server
//         const config: ApolloServerExpressConfig = {
//             typeDefs,
//             resolvers,
//             playground,
//             introspection: playground,
//         };
//         const apollo = new ApolloServer(config);
//         // https://www.apollographql.com/docs/apollo-server/integrations/middleware/#applying-middleware
//         apollo.applyMiddleware({ app: this.app, path: PATHS.graphql });
//     }

//     private htmlRoutes() {
//         const router = Router(); // eslint-disable-line new-cap
//         router.route('/').get(index);
//         router.route('/suche').get(suche);
//         router.route('/neues-buch').get(neuesBuch);
//         this.app.use(PATHS.html, router);

//         // Alternativen zu Pug: EJS, Handlebars, ...
//         // https://github.com/expressjs/express/wiki#template-engines
//         this.app.set('view engine', 'ejs');
//         // __dirname ist das Verzeichnis ".../dist/server"
//         /* global __dirname */
//         this.app.set('views', join(__dirname, 'views'));
//         this.app.use(express.static(join(__dirname, 'public')));
//     }
// }
export const { app } = new App();
