import cors from 'cors';

export const corsHandler =
    // CORS = Cross Origin Resource Sharing
    cors({
        origin: 'https://localhost:4200',
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: [
            'Origin',
            'Content-Type',
            'Accept',
            'Authorization',
            'Allow',
            'Content-Length',
            'Date',
            'Last-Modified',
            'If-Match',
            'If-Not-Match',
            'If-Modified-Since',
        ],
        exposedHeaders: ['Location', 'ETag'],
        maxAge: 86400,
    });
