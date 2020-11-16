import {
    MAX_REQUESTS_PER_WINDOW,
    WINDOW_SIZE,
    internalError,
    logRequestHeader,
    notFound,
    responseTimeFn,
    serverConfig,
    validateContentType,
    validateUUID,
} from './shared';
import {
    create,
    deleteFn,
    download,
    find,
    findById,
    update,
    upload,
} from './film/rest';
import { index, neuerFilm, suche } from './film/html';
import { isAdmin, isAdminMitarbeiter, login, validateJwt } from './auth';
import { json, urlencoded } from 'body-parser';
import { resolvers, typeDefs } from './film/graphql';
import { ApolloServer } from 'apollo-server-express';
import type { ApolloServerExpressConfig } from 'apollo-server-express';
import type { Options } from 'express-rate-limit';
import bearerToken from 'express-bearer-token';
import compression from 'compression';
import express from 'express';
import { helmetHandlers } from './security';
import { join } from 'path';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import responseTime from 'response-time';

const { Router } = express; // eslint-disable-line @typescript-eslint/naming-convention

const rateLimitOptions: Options = {
    // z.B. 15 Minuten als Zeitfenster (Ms = Millisekunden)
    windowMs: WINDOW_SIZE,
    // z.B. max 100 requests/IP in einem Zeitfenster
    max: MAX_REQUESTS_PER_WINDOW,
};
const limiter = rateLimit(rateLimitOptions);

const apiPath = '/api';
export const PATHS = {
    buecher: `${apiPath}/filme`,
    login: `${apiPath}/login`,
    graphql: '/graphql',
    html: '/html',
};

class App {
    readonly app = express();

    constructor() {
        this.config();
        this.routes();
    }

    private config() {
        if (serverConfig.dev) {
            // Logging der eingehenden Requests in der Console
            this.app.use(
                morgan('dev'),
                // Protokollierung der Response Time
                responseTime(responseTimeFn),
                // Protokollierung des eingehenden Request-Headers
                logRequestHeader,
            );
        }

        this.app.use(
            bearerToken(),

            ...helmetHandlers,
            compression(),
            limiter,
        );
    }

    private routes() {
        this.filmeRoutes();
        this.loginRoutes();
        this.filmGraphqlRoutes();
        this.htmlRoutes();

        this.app.get('*', notFound);
        this.app.use(internalError);
    }

    private filmeRoutes() {
        const router = Router(); // eslint-disable-line new-cap
        router
            .route('/')
            // https://expressjs.com/en/api.html#app.get.method
            .get(find)
            .post(
                validateJwt,
                validateContentType,
                isAdminMitarbeiter,
                json(),
                create,
            );

        const idParam = 'id';
        router
            .param(idParam, validateUUID)
            .get(`/:${idParam}`, findById)
            .put(
                `/:${idParam}`,
                validateJwt,
                validateContentType,
                isAdminMitarbeiter,
                json(),
                update,
            )
            .delete(`/:${idParam}`, validateJwt, isAdmin, deleteFn)
            .put(`/:${idParam}/file`, validateJwt, isAdminMitarbeiter, upload)
            .get(`/:${idParam}/file`, download);

        this.app.use(PATHS.buecher, router);
    }

    private loginRoutes() {
        const router = Router(); // eslint-disable-line new-cap
        router.route('/').post(
            urlencoded({
                extended: false,
                type: 'application/x-www-form-urlencoded',
            }),
            login,
        );
        this.app.use(PATHS.login, router);
    }

    private filmGraphqlRoutes() {
        const { playground } = serverConfig;
        // https://www.apollographql.com/docs/apollo-server/data/resolvers/#passing-resolvers-to-apollo-server
        const config: ApolloServerExpressConfig = {
            typeDefs,
            resolvers,
            playground,
            introspection: playground,
        };
        const apollo = new ApolloServer(config);
        // https://www.apollographql.com/docs/apollo-server/integrations/middleware/#applying-middleware
        apollo.applyMiddleware({ app: this.app, path: PATHS.graphql });
    }

    private htmlRoutes() {
        const router = Router(); // eslint-disable-line new-cap
        router.route('/').get(index);
        router.route('/suche').get(suche);
        router.route('/neuer-Film').get(neuerFilm);
        this.app.use(PATHS.html, router);

        // Alternativen zu Pug: EJS, Handlebars, ...
        // https://github.com/expressjs/express/wiki#template-engines
        this.app.set('view engine', 'ejs');
        // __dirname ist das Verzeichnis ".../dist/server"
        /* global __dirname */
        // TODO: views und public anpassen
        this.app.set('views', join(__dirname, 'views'));
        this.app.use(express.static(join(__dirname, 'public')));
    }
}
export const { app } = new App();
