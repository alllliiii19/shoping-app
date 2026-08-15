import {
  listProducts,
  getProductById,
  getVariantsByProductId,
  getImagesByProductId,
} from '../models/productModel.js';

export async function getProducts(req, res, next) {
  try {
    const filters = {
      category: req.query.category,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      gender: req.query.gender,
      search: req.query.search,
      sort: req.query.sort,
    };

    const products = await listProducts(filters);

    return res.status(200).json({
      count: products.length,
      products,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductDetail(req, res, next) {
  try {
    const { id } = req.params;

    // 1. Fetch the product
    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 2. Fetch its variants and images
    const variants = await getVariantsByProductId(id);
    const images = await getImagesByProductId(id);

    // 3. Assemble into one nested object
    return res.status(200).json({
      product: {
        ...product,
        variants,
        images,
      },
    });
  } catch (err) {
    next(err);
  }
}