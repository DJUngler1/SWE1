/* eslint-disable max-classes-per-file, @typescript-eslint/no-type-alias */
import type { ValidationErrorMsg } from './../entity';

export class FilmServiceError {} // eslint-disable-line @typescript-eslint/no-extraneous-class

export class FilmInvalid extends FilmServiceError {
    constructor(readonly msg: ValidationErrorMsg) {
        super();
    }
}

export class TitelExists extends FilmServiceError {
    constructor(readonly titel: string, readonly id: string) {
        super();
    }
}

export class VersionInvalid extends FilmServiceError {
    constructor(readonly version: string | undefined) {
        super();
    }
}

export class VersionOutdated extends FilmServiceError {
    constructor(readonly id: string, readonly version: number) {
        super();
    }
}

export class FilmNotExists extends FilmServiceError {
    constructor(readonly id: string | undefined) {
        super();
    }
}

export type CreateError = FilmInvalid | TitelExists;

export type UpdateError =
    | FilmInvalid
    | FilmNotExists
    | TitelExists
    | VersionInvalid
    | VersionOutdated;

export class FilmFileServiceError {} // eslint-disable-line @typescript-eslint/no-extraneous-class

export class FileNotFound extends FilmFileServiceError {
    constructor(readonly filename: string) {
        super();
    }
}

export class MultipleFiles extends FilmFileServiceError {
    constructor(readonly filename: string) {
        super();
    }
}

export type DownloadError = FilmNotExists | FileNotFound | MultipleFiles;

/* eslint-enable max-classes-per-file, @typescript-eslint/no-type-alias */
