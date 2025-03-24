import { Router } from 'express';
import expressAsyncHandler from 'express-async-handler';

import { ensureToken } from '../middlewares/auth';
import { addProductAttribute } from './addProductAttribute';
import { authRoutes } from './auth';
import { createAttribute } from './createAttribute';
import { createProduct } from './createProduct';
import { deleteAttribute } from './deleteAttribute';
import { deleteProduct } from './deleteProduct';
import { deleteProductAttribute } from './deleteProductAttribute';
import { getAttributes } from './getAttributes';
import { getProduct } from './getProduct';
import { getProducts } from './getProducts';
import { updateProduct } from './updateProduct';
import { updateProductAttribute } from './updateProductAttribute';

export const routes = Router();

// Health check
routes.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected!' });
});

// Auth
routes.use('/auth', authRoutes);

// Ensure Token Middleware
routes.use(expressAsyncHandler(ensureToken));

// Protected routes
routes.post('/products', expressAsyncHandler(createProduct));
routes.get('/products', expressAsyncHandler(getProducts));
routes.get('/products/:product_id', expressAsyncHandler(getProduct));
routes.patch('/products/:product_id', expressAsyncHandler(updateProduct));
routes.delete('/products/:product_id', expressAsyncHandler(deleteProduct));
// routes.get('/products/:product_id/attributes', expressAsyncHandler(getProductAttributes));
routes.post(
  '/products/:product_id/attributes/:attribute_id',
  expressAsyncHandler(addProductAttribute)
);
routes.patch(
  '/products/:product_id/attributes/:attribute_id/:product_attribute_lookup_id',
  expressAsyncHandler(updateProductAttribute)
);
routes.delete(
  '/products/:product_id/attributes/:attribute_id/:product_attribute_lookup_id',
  expressAsyncHandler(deleteProductAttribute)
);

routes.post('/attributes', expressAsyncHandler(createAttribute));
routes.get('/attributes', expressAsyncHandler(getAttributes));
// routes.patch('/attributes/:attribute_id', expressAsyncHandler(updateAttribute));
routes.delete('/attributes/:attribute_id', expressAsyncHandler(deleteAttribute));
