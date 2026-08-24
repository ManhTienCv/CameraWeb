import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const BrandController = {
  async index(req: Request, res: Response) {
    try {
      const brands = await prisma.brand.findMany({
        orderBy: { name: 'asc' },
      });

      const formatted = brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        logo_url: b.logoUrl,
      }));

      return res.json(formatted);
    } catch (error) {
      console.error('Error fetching brands:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },
};
