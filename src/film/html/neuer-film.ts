import type { Request, Response } from 'express';

export const neuerFilm = (_: Request, res: Response) => {
    res.render('neuer-film', { title: 'Neuer Film' });
};
