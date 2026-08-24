import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

function getSessionId(req: Request): string {
  const headerId = req.header('X-Session-ID') || (req.query.session_id as string) || req.body?.session_id;
  if (headerId && typeof headerId === 'string' && headerId.trim() !== '') {
    return headerId.trim();
  }
  return `sess_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
}

async function getOrCreateCart(sessionId: string) {
  let cart = await prisma.cart.findUnique({
    where: { sessionId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { sessionId },
    });
  }

  return cart;
}

function formatCartResponse(cart: any) {
  const items = (cart.items || []).map((item: any) => {
    const product = item.product;
    let formattedProduct = null;

    if (product) {
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

      formattedProduct = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand || '',
        description: product.description || '',
        price: product.price,
        original_price: product.originalPrice,
        category_id: product.categoryId,
        image_url: product.imageUrl || gallery[0] || '',
        gallery,
        specs: specsObj,
        rating: product.rating,
        review_count: product.reviewCount,
        stock: product.stock,
      };
    }

    return {
      id: item.id,
      cart_id: item.cartId,
      product_id: item.productId,
      quantity: item.quantity,
      created_at: item.createdAt.toISOString(),
      product: formattedProduct,
    };
  });

  return {
    id: cart.id,
    session_id: cart.sessionId,
    items,
  };
}

export const CartController = {
  async show(req: Request, res: Response) {
    try {
      const sessionId = getSessionId(req);
      const cart = await getOrCreateCart(sessionId);

      const fullCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { orderBy: { displayOrder: 'asc' } },
                  specs: true,
                },
              },
            },
          },
        },
      });

      return res.json(formatCartResponse(fullCart));
    } catch (error) {
      console.error('Error fetching cart:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async addItem(req: Request, res: Response) {
    try {
      const sessionId = getSessionId(req);
      const { product_id, quantity } = req.body;

      if (!product_id) {
        return res.status(422).json({ message: 'Product ID is required' });
      }

      const cart = await getOrCreateCart(sessionId);
      const qty = Math.max(1, parseInt(quantity || 1, 10));

      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: product_id,
        },
      });

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + qty },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product_id,
            quantity: qty,
          },
        });
      }

      const fullCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { orderBy: { displayOrder: 'asc' } },
                  specs: true,
                },
              },
            },
          },
        },
      });

      return res.json(formatCartResponse(fullCart));
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async updateItem(req: Request, res: Response) {
    try {
      const sessionId = getSessionId(req);
      const { id } = req.params;
      const { quantity } = req.body;

      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty < 1) {
        return res.status(422).json({ message: 'Số lượng phải lớn hơn hoặc bằng 1' });
      }

      await prisma.cartItem.update({
        where: { id },
        data: { quantity: qty },
      });

      const cart = await getOrCreateCart(sessionId);
      const fullCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { orderBy: { displayOrder: 'asc' } },
                  specs: true,
                },
              },
            },
          },
        },
      });

      return res.json(formatCartResponse(fullCart));
    } catch (error) {
      console.error('Error updating cart item:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async removeItem(req: Request, res: Response) {
    try {
      const sessionId = getSessionId(req);
      const { id } = req.params;

      await prisma.cartItem.delete({ where: { id } }).catch(() => null);

      const cart = await getOrCreateCart(sessionId);
      const fullCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { orderBy: { displayOrder: 'asc' } },
                  specs: true,
                },
              },
            },
          },
        },
      });

      return res.json(formatCartResponse(fullCart));
    } catch (error) {
      console.error('Error removing cart item:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async clear(req: Request, res: Response) {
    try {
      const sessionId = getSessionId(req);
      const cart = await prisma.cart.findUnique({ where: { sessionId } });

      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
      console.error('Error clearing cart:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },
};
