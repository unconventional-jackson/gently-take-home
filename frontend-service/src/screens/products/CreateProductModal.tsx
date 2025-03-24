import { Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import { UseQueryResult } from '@tanstack/react-query';
import { GetProductsResponse } from '@unconventional-jackson/gently-openapi-service';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { useSdk } from '../../api/sdk';
import { CustomButton } from '../../components/Button/Button';
import { parseAxiosError } from '../../utils/errors';
import { Custom } from '../../components/Custom';

interface CreateProductModalProps {
  visible: boolean;
  onClose: () => void;
  query: UseQueryResult<GetProductsResponse | undefined, Error>;
}

export function CreateProductModal({ visible, onClose, query }: CreateProductModalProps) {
  const apiSdk = useSdk();

  /**
   * Manage the product name
   */
  const [productName, setProductName] = useState<string>('');
  const handleChangeProductName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setProductName(event.target.value);
  }, []);

  /**
   * Manage the product description
   */
  const [productDescription, setProductDescription] = useState<string>('');
  const handleChangeProductDescription = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setProductDescription(event.target.value);
    },
    []
  );

  /**
   * Clear the form when the modal is opened
   */
  useEffect(() => {
    setProductName('');
    setProductDescription('');
  }, [visible]);

  /**
   * Handle form acceptance
   */
  const disabledHint = useMemo(() => {
    if (!productName) {
      return 'Product name is required';
    }

    return '';
  }, [productName, productDescription]);
  const [loading, setLoading] = useState(false);
  const handleConfirm = useCallback(async () => {
    try {
      setLoading(true);
      if (!productName) {
        throw new Error('Product name is required');
      }
      await apiSdk.createProduct({
        product_name: productName,
        product_description: productDescription,
      });
      await query.refetch();
      toast.success('Product created successfully');
      onClose();
    } catch (error) {
      toast.error(`Failed to create product: ${parseAxiosError(error)}`);
    } finally {
      setLoading(false);
    }
  }, [apiSdk, query, onClose, productName, productDescription]);

  return (
    <Dialog open={visible} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Product</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography>Please provide the product's basic information to create it.</Typography>
          </Grid>
          <Grid item xs={12}>
            <Custom.Input
              label="Product Name"
              value={productName}
              onChange={handleChangeProductName}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Custom.Input
              label="Product Description"
              value={productDescription}
              onChange={handleChangeProductDescription}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions
        sx={{
          pl: 3,
          pr: 3,
          justifyContent: 'space-between',
        }}
      >
        <CustomButton variant="text" color="primary" onClick={onClose}>
          Cancel
        </CustomButton>
        <CustomButton
          autoFocus
          onClick={handleConfirm}
          disabled={!!disabledHint || loading}
          disabledHint={disabledHint}
          loading={loading}
        >
          Create Product
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
