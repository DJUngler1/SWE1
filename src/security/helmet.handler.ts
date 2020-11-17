import {
    contentSecurityPolicy,
    frameguard,
    hidePoweredBy,
    hsts,
    noSniff,
    xssFilter,
} from 'helmet';

export const helmetHandlers = [
    contentSecurityPolicy({
        directives: {
            /* eslint-disable quotes */
            defaultSrc: ["https: 'self'"],
            styleSrc: ["https: 'unsafe-inline'"],
            scriptSrc: ["https: 'unsafe-inline' 'unsafe-eval'"],
            imgSrc: ["data: 'self'"],
            /* eslint-enable quotes */
        },
    }),

    xssFilter(),

    frameguard(),

    hsts(),

    noSniff(),

    hidePoweredBy(),
];
