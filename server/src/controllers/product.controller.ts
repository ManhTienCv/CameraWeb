import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

function formatProduct(product: any) {
  const gallery = product.images ? product.images.map((img: any) => img.imageUrl) : [];
  if (gallery.length === 0 && product.imageUrl) {
    gallery.push(product.imageUrl);
  }

  const specsObj: Record<string, string> = {};
  if (product.specs && Array.isArray(product.specs)) {
    product.specs.forEach((s: any) => {
      specsObj[s.specKey] = s.specValue;
    });
  }

  const features = product.features && Array.isArray(product.features)
    ? product.features.map((f: any) => f.featureText)
    : [];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand || (product.brandModel ? product.brandModel.name : 'N/A'),
    description: product.description || '',
    price: product.price,
    original_price: product.originalPrice,
    category_id: product.categoryId,
    category_name: product.category ? product.category.name : 'N/A',
    image_url: product.imageUrl || gallery[0] || '',
    gallery,
    specs: specsObj,
    features,
    rating: product.rating,
    review_count: product.reviewCount,
    stock: product.stock,
    status: product.status || 'active',
    is_featured: product.isFeatured,
    is_new: product.isNew,
    created_at: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString(),
  };
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${base}-${Math.random().toString(36).substring(2, 7)}`;
}

export const ProductController = {
  async index(req: Request, res: Response) {
    try {
      const { category, brand, q, sort, include_inactive } = req.query;

      const where: any = {};

      if (!include_inactive) {
        where.status = 'active';
      }

      if (category && typeof category === 'string') {
        where.category = {
          slug: category,
        };
      }

      if (brand && typeof brand === 'string') {
        where.OR = [
          { brand: { contains: brand } },
          { brandModel: { slug: brand } },
        ];
      }

      if (q && typeof q === 'string') {
        where.OR = [
          { name: { contains: q } },
          { description: { contains: q } },
          { sku: { contains: q } },
        ];
      }

      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'price-asc') {
        orderBy = { price: 'asc' };
      } else if (sort === 'price-desc') {
        orderBy = { price: 'desc' };
      } else if (sort === 'rating') {
        orderBy = { rating: 'desc' };
      } else if (sort === 'newest') {
        orderBy = { createdAt: 'desc' };
      }

      const products = await prisma.product.findMany({
        where,
        orderBy,
        include: {
          category: true,
          brandModel: true,
          images: { orderBy: { displayOrder: 'asc' } },
          specs: true,
          features: { orderBy: { displayOrder: 'asc' } },
        },
      });

      return res.json(products.map(formatProduct));
    } catch (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async featured(req: Request, res: Response) {
    try {
      const type = req.query.type || 'featured';
      const where: any = { status: 'active' };

      if (type === 'new') {
        where.isNew = true;
      } else {
        where.isFeatured = true;
      }

      const products = await prisma.product.findMany({
        where,
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          brandModel: true,
          images: { orderBy: { displayOrder: 'asc' } },
          specs: true,
          features: { orderBy: { displayOrder: 'asc' } },
        },
      });

      return res.json(products.map(formatProduct));
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async search(req: Request, res: Response) {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      if (!q) {
        return res.json([]);
      }

      const products = await prisma.product.findMany({
        where: {
          status: 'active',
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
            { brand: { contains: q } },
          ],
        },
        include: {
          category: true,
          brandModel: true,
          images: { orderBy: { displayOrder: 'asc' } },
          specs: true,
          features: { orderBy: { displayOrder: 'asc' } },
        },
      });

      return res.json(products.map(formatProduct));
    } catch (error) {
      console.error('Error searching products:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async show(req: Request, res: Response) {
    try {
      const { slug } = req.params;

      const product = await prisma.product.findFirst({
        where: {
          OR: [{ slug }, { id: slug }],
        },
        include: {
          category: true,
          brandModel: true,
          images: { orderBy: { displayOrder: 'asc' } },
          specs: true,
          features: { orderBy: { displayOrder: 'asc' } },
        },
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      return res.json(formatProduct(product));
    } catch (error) {
      console.error('Error fetching product detail:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async store(req: Request, res: Response) {
    try {
      const {
        name,
        category_id,
        brand,
        price,
        original_price,
        stock,
        description,
        image_url,
        status,
        is_featured,
        gallery,
        features,
        specs,
      } = req.body;

      if (!name || !category_id || price === undefined) {
        return res.status(422).json({ message: 'Tên sản phẩm, danh mục và giá là bắt buộc' });
      }

      const slug = generateSlug(name);
      const sku = `CAM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const defaultImg =
        image_url ||
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000';

      const created = await prisma.product.create({
        data: {
          name,
          slug,
          brand: brand || 'Khác',
          categoryId: category_id,
          sku,
          description: description || '',
          price: parseFloat(price),
          originalPrice: original_price ? parseFloat(original_price) : null,
          imageUrl: defaultImg,
          stock: stock ? parseInt(stock, 10) : 10,
          rating: 5.0,
          reviewCount: 0,
          isFeatured: Boolean(is_featured),
          isNew: true,
          status: status || 'active',
          images: {
            create: Array.isArray(gallery) && gallery.length > 0
              ? gallery.filter(Boolean).map((url: string, idx: number) => ({
                  imageUrl: url,
                  isPrimary: idx === 0,
                  displayOrder: idx,
                }))
              : [{ imageUrl: defaultImg, isPrimary: true, displayOrder: 0 }],
          },
          features: {
            create: Array.isArray(features)
              ? features.filter((f: string) => f && f.trim() !== '').map((f: string, idx: number) => ({
                  featureText: f.trim(),
                  displayOrder: idx,
                }))
              : [],
          },
          specs: {
            create: specs && typeof specs === 'object'
              ? Object.entries(specs)
                  .filter(([k, v]) => k.trim() && String(v).trim())
                  .map(([k, v]) => ({
                    specKey: k.trim(),
                    specValue: String(v).trim(),
                  }))
              : [],
          },
        },
        include: {
          category: true,
          brandModel: true,
          images: { orderBy: { displayOrder: 'asc' } },
          specs: true,
          features: { orderBy: { displayOrder: 'asc' } },
        },
      });

      return res.status(201).json({
        message: 'Sản phẩm đã được thêm thành công!',
        product: formatProduct(created),
      });
    } catch (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        category_id,
        brand,
        price,
        original_price,
        stock,
        description,
        image_url,
        status,
        gallery,
        features,
        specs,
      } = req.body;

      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const updateData: any = {};
      if (name && name !== existing.name) {
        updateData.name = name;
        updateData.slug = generateSlug(name);
      }
      if (category_id) updateData.categoryId = category_id;
      if (brand) updateData.brand = brand;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (original_price !== undefined) {
        updateData.originalPrice = original_price ? parseFloat(original_price) : null;
      }
      if (stock !== undefined) updateData.stock = parseInt(stock, 10);
      if (description !== undefined) updateData.description = description;
      if (image_url) updateData.imageUrl = image_url;
      if (status) updateData.status = status;

      // Update product core
      await prisma.product.update({
        where: { id },
        data: updateData,
      });

      // Update gallery
      if (Array.isArray(gallery)) {
        await prisma.productImage.deleteMany({ where: { productId: id } });
        const validUrls = gallery.filter(Boolean);
        if (validUrls.length > 0) {
          await prisma.productImage.createMany({
            data: validUrls.map((url: string, idx: number) => ({
              productId: id,
              imageUrl: url,
              isPrimary: idx === 0,
              displayOrder: idx,
            })),
          });
        }
      }

      // Update features
      if (Array.isArray(features)) {
        await prisma.productFeature.deleteMany({ where: { productId: id } });
        const validFeats = features.filter((f: string) => f && f.trim() !== '');
        if (validFeats.length > 0) {
          await prisma.productFeature.createMany({
            data: validFeats.map((f: string, idx: number) => ({
              productId: id,
              featureText: f.trim(),
              displayOrder: idx,
            })),
          });
        }
      }

      // Update specs
      if (specs && typeof specs === 'object') {
        await prisma.productSpecification.deleteMany({ where: { productId: id } });
        const validSpecs = Object.entries(specs).filter(
          ([k, v]) => k.trim() && String(v).trim()
        );
        if (validSpecs.length > 0) {
          await prisma.productSpecification.createMany({
            data: validSpecs.map(([k, v]) => ({
              productId: id,
              specKey: k.trim(),
              specValue: String(v).trim(),
            })),
          });
        }
      }

      const updated = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          brandModel: true,
          images: { orderBy: { displayOrder: 'asc' } },
          specs: true,
          features: { orderBy: { displayOrder: 'asc' } },
        },
      });

      return res.json({
        message: 'Cập nhật sản phẩm thành công!',
        product: formatProduct(updated),
      });
    } catch (error: any) {
      console.error('Error updating product:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật' });
      }
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async destroy(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.product.delete({ where: { id } });
      return res.json({ message: 'Đã xóa sản phẩm thành công!' });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa' });
      }
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },
};
