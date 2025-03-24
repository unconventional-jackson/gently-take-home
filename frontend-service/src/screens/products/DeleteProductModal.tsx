import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { Product } from '@unconventional-jackson/gently-openapi-service';
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';

import { useSdk } from '../../api/sdk';
import { CustomButton } from '../../components/Button/Button';
import { parseAxiosError } from '../../utils/errors';

interface DeleteProductModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onDeleted: () => Promise<unknown>;
}

export function DeleteProductModal({ open, onClose, product, onDeleted }: DeleteProductModalProps) {
  const apiSdk = useSdk();
  const [loading, setLoading] = useState(false);
  const handleDeleteProduct = useCallback(async () => {
    try {
      if (!product?.product_id) {
        throw new Error('Product is missing');
      }
      setLoading(true);

      await apiSdk.deleteProduct(product.product_id);
      toast.success('Product was successfully deleted.');
      await onDeleted();
      onClose();
    } catch (error) {
      toast.error(`Failed to delete product: ${parseAxiosError(error)}`);
    } finally {
      setLoading(false);
    }
  }, [product, apiSdk, onDeleted, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bulk Remove Bales</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to delete the Product&nbsp;
          <strong>{product?.product_name || 'Unknown Product Name'}</strong>? This action cannot be
          undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <CustomButton
          onClick={handleDeleteProduct}
          loading={loading}
          color="error"
          variant="contained"
        >
          Delete Product
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
