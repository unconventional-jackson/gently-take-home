import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { Attribute } from '@unconventional-jackson/gently-openapi-service';
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';

import { useSdk } from '../../api/sdk';
import { CustomButton } from '../../components/Button/Button';
import { parseAxiosError } from '../../utils/errors';

interface DeleteAttributeModalProps {
  open: boolean;
  onClose: () => void;
  attribute: Attribute | null;
  onDeleted: () => Promise<unknown>;
}

export function DeleteAttributeModal({
  open,
  onClose,
  attribute,
  onDeleted,
}: DeleteAttributeModalProps) {
  const apiSdk = useSdk();
  const [loading, setLoading] = useState(false);
  const handleDeleteAttribute = useCallback(async () => {
    try {
      if (!attribute?.attribute_id) {
        throw new Error('Attribute is missing');
      }
      setLoading(true);

      await apiSdk.deleteAttribute(attribute.attribute_id);
      toast.success('Attribute was successfully deleted.');
      await onDeleted();
      onClose();
    } catch (error) {
      toast.error(`Failed to delete attribute: ${parseAxiosError(error)}`);
    } finally {
      setLoading(false);
    }
  }, [attribute, apiSdk, onDeleted, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Attribute</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to delete the Attribute&nbsp;
          <strong>{attribute?.attribute_name || 'Unknown Attribute Name'}</strong>? This action
          cannot be undone. Note that any products that have this attribute&nbsp;
          <strong>will not be affected</strong>, however, they will no longer have this attribute
          associated with them.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <CustomButton
          onClick={handleDeleteAttribute}
          loading={loading}
          color="error"
          variant="contained"
        >
          Delete Attribute
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
