import type { Request, Response } from 'express';
import { FilmService } from '../service/film.service';
import { logger } from './../../shared/logger';

const filmService = new FilmService();

export const suche = async (req: Request, res: Response) => {
    logger.error(`suche(): ${req.url}`);
    const filme = await filmService.find();
    res.render('suche', { title: 'Suche', filme });
};
