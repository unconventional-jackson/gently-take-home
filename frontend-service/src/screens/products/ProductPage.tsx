import { Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useSdk } from '../../api/sdk';
import { CustomInput } from '../../components/Custom/Input';
import { parseAxiosError } from '../../utils/errors';
import { Custom } from '../../components/Custom';
import { Section } from '../../components/Custom/Section';
import { PageLayout } from '../../components/PageLayout/PageLayout';
import { MainContent } from '../../components/MainContent/MainContent';
import { ProductAttribute } from './ProductAttribute';
import { AddProductAttributeModal } from './AddProductAttributeModal';
import { Add, Refresh } from '@mui/icons-material';

export function ProductPage() {
  const { product_id } = useParams();

  const apiSdk = useSdk();

  const query = useQuery({
    queryKey: ['getProduct', { product_id }],
    queryFn: async () => {
      try {
        if (!product_id) {
          throw new Error('Missing product ID');
        }
        const response = await apiSdk.getProduct(product_id);
        return response.data;
      } catch (error) {
        toast.error(`Failed to fetch product: ${parseAxiosError(error)}`);
        throw error;
      }
    },
    enabled: !!product_id,
    // retry: 1,
  });

  const product = useMemo(
    () => ({
      ...query.data,
    }),
    [query.data]
  );

  /**
   * Manage the product name
   */
  const [productName, setProductName] = useState(product.product_name);
  const handleChangeProductName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setProductName(event.target.value);
  }, []);

  /**
   * Manage the product description
   */
  const [productDescription, setProductDescription] = useState(product.product_description);
  const handleChangeProductDescription = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setProductDescription(event.target.value);
    },
    []
  );

  /**
   * Manage the visibility of the add product attribute modal
   */
  const [addProductAttributeModalVisible, setAddProductAttributeModalVisible] = useState(false);
  const handleOpenAddProductAttributeModal = useCallback(() => {
    setAddProductAttributeModalVisible(true);
  }, []);
  const handleCloseAddProductAttributeModal = useCallback(() => {
    setAddProductAttributeModalVisible(false);
  }, []);

  /**
   * React to changes in the product
   */
  useEffect(() => {
    if (!product.product_id) {
      return;
    }
    if (product.product_name) {
      setProductName(product.product_name);
    }
    if (product.product_description) {
      setProductDescription(product.product_description);
    }
  }, [product.product_id, product.product_name, product.product_description]);

  if (!product_id) {
    return null;
  }

  const disabledUpdateProductHint = useMemo(() => {
    if (
      productName === product.product_name &&
      productDescription === product.product_description
    ) {
      return 'No changes to update';
    }
    return '';
  }, [productName, productDescription, product.product_name, product.product_description]);

  const [loading, setLoading] = useState(false);
  const handleUpdateProduct = useCallback(async () => {
    try {
      setLoading(true);
      await apiSdk.updateProduct(product_id, {
        product_name: productName,
        product_description: productDescription,
      });
      toast.success('Product updated successfully');
      await query.refetch();
    } catch (error) {
      toast.error(`Failed to update product: ${parseAxiosError(error)}`);
    } finally {
      setLoading(false);
    }
  }, [product_id, productName, productDescription, apiSdk]);

  return (
    <PageLayout>
      <MainContent>
        <Section
          title="Product"
          description="A product is a reference item in our inventory. We are not currently tracking quantity."
          onInfoClick={() => query.refetch()}
          infoIcon={<Refresh />}
          iconLabel="Refresh"
        >
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Custom.Input
                label="Product Name"
                value={productName}
                onChange={handleChangeProductName}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={6}>
              <Custom.Input
                label="Product ID"
                value={product.product_id || 'Missing Product ID'}
                fullWidth
                variant="outlined"
                disabled
                copyValue={product.product_id}
                copyLabel="Product ID"
              />
            </Grid>
            <Grid item xs={6}>
              <Custom.Input
                label="Created By"
                value={product.created_by || 'Unknown'}
                fullWidth
                variant="outlined"
                disabled
                copyValue={product.created_by}
                copyLabel="Created By"
              />
            </Grid>
            <Grid item xs={6}>
              <Custom.Input
                label="Updated By"
                value={product.updated_by || 'Unknown'}
                fullWidth
                variant="outlined"
                disabled
                copyValue={product.updated_by}
                copyLabel="Updated By"
              />
            </Grid>
            <Grid item xs={6}>
              <Custom.Input
                label="Created At"
                value={
                  product.created_at ? new Date(product.created_at).toLocaleString() : 'Unknown'
                }
                fullWidth
                variant="outlined"
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <Custom.Input
                label="Updated At"
                value={
                  product.updated_at ? new Date(product.updated_at).toLocaleString() : 'Unknown'
                }
                fullWidth
                variant="outlined"
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <CustomInput
                label="Product Description"
                value={productDescription}
                onChange={handleChangeProductDescription}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={6} display="flex" justifyContent="flex-end" alignItems="flex-end">
              <Custom.Button
                variant="contained"
                onClick={handleUpdateProduct}
                loading={loading}
                disabled={!!disabledUpdateProductHint}
                disabledHint={disabledUpdateProductHint}
              >
                Update Product
              </Custom.Button>
            </Grid>
          </Grid>
        </Section>
        <Section
          title="Attributes"
          description="Attributes are key-value pairs that describe the product."
          onInfoClick={handleOpenAddProductAttributeModal}
          infoIcon={<Add />}
          iconLabel="Add Attr."
        >
          <Grid container spacing={2}>
            {query.data?.product_attribute_lookups?.length ? (
              query.data?.product_attribute_lookups.map((productAttributeLookup) => (
                <Grid item>
                  <ProductAttribute productAttributeLookup={productAttributeLookup} query={query} />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography variant="body1">No attributes found</Typography>
              </Grid>
            )}
          </Grid>
        </Section>
      </MainContent>
      <AddProductAttributeModal
        productId={product_id}
        visible={addProductAttributeModalVisible}
        onClose={handleCloseAddProductAttributeModal}
        query={query}
      />
    </PageLayout>
  );
}
