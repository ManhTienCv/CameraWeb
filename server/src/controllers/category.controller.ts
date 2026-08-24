import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const CategoryController = {
  async index(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { displayOrder: 'asc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      const formatted = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        display_order: cat.displayOrder,
        products_count: cat._count.products,
        created_at: cat.createdAt.toISOString(),
      }));

      return res.json(formatted);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async show(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const category = await prisma.category.findFirst({
        where: {
          OR: [{ slug }, { id: slug }],
        },
        include: {
          products: {
            where: { status: 'active' },
            include: {
              images: { orderBy: { displayOrder: 'asc' } },
              specs: true,
              features: { orderBy: { displayOrder: 'asc' } },
            },
          },
        },
      });

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      const formattedProducts = category.products.map((p) => {
        const gallery = p.images.map((img) => img.imageUrl);
        const specsObj: Record<string, string> = {};
        p.specs.forEach((s) => {
          specsObj[s.specKey] = s.specValue;
        });

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          description: p.description || '',
          price: p.price,
          original_price: p.originalPrice,
          category_id: p.categoryId,
          category_name: category.name,
          image_url: p.imageUrl || gallery[0] || '',
          gallery: gallery.length > 0 ? gallery : p.imageUrl ? [p.imageUrl] : [],
          specs: specsObj,
          features: p.features.map((f) => f.featureText),
          rating: p.rating,
          review_count: p.reviewCount,
          stock: p.stock,
          status: p.status,
          is_featured: p.isFeatured,
          is_new: p.isNew,
          created_at: p.createdAt.toISOString(),
        };
      });

      return res.json({
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
        },
        products: formattedProducts,
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async store(req: Request, res: Response) {
    try {
      const { name, description, icon } = req.body;
      if (!name) {
        return res.status(422).json({ message: 'Tên danh mục là bắt buộc' });
      }

      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      const maxOrder = await prisma.category.aggregate({
        _max: { displayOrder: true },
      });

      const category = await prisma.category.create({
        data: {
          name,
          slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
          description: description || null,
          icon: icon || 'Camera',
          displayOrder: (maxOrder._max.displayOrder || 0) + 1,
        },
      });

      return res.status(201).json({
        message: 'Danh mục đã được tạo thành công!',
        category,
      });
    } catch (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, icon } = req.body;

      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(icon && { icon }),
        },
      });

      return res.json({
        message: 'Cập nhật danh mục thành công!',
        category,
      });
    } catch (error: any) {
      console.error('Error updating category:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Không tìm thấy danh mục để cập nhật' });
      }
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async destroy(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.category.delete({
        where: { id },
      });

      return res.json({
        message: 'Đã xóa danh mục thành công!',
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Không tìm thấy danh mục để xóa' });
      }
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },
};
