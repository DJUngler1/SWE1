import type { Request, Response } from 'express';

export const index = (_: Request, res: Response) => {
    res.render('index', { title: 'Beispiel' });
};

export * from './neuer-film';
export * from './suche';
