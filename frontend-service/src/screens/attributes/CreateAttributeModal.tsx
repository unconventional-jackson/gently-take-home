import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { UseQueryResult } from '@tanstack/react-query';
import {
  AttributeAttributeTypeEnum,
  GetAttributesResponse,
} from '@unconventional-jackson/gently-openapi-service';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { useSdk } from '../../api/sdk';
import { CustomButton } from '../../components/Button/Button';
import { parseAxiosError } from '../../utils/errors';
import { Custom } from '../../components/Custom';

interface CreateAttributeModalProps {
  visible: boolean;
  onClose: () => void;
  query: UseQueryResult<GetAttributesResponse, Error>;
}

export function CreateAttributeModal({ visible, onClose, query }: CreateAttributeModalProps) {
  const apiSdk = useSdk();

  /**
   * Manage the attribute short code
   */
  const [shortCode, setShortCode] = useState('');
  const handleShortCodeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setShortCode(
      event.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 10)
    );
  }, []);

  /**
   * Manage the attribute name; any time the user manually changes the attribute name, update the short code to match closely
   */
  const [attributeName, setAttributeName] = useState('');
  const handleAttributeNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAttributeName(event.target.value);
    if (event.target.value) {
      setShortCode(
        event.target.value
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 10)
      );
    }
  }, []);

  /**
   * Manage the attribute description
   */
  const [attributeDescription, setAttributeDescription] = useState('');
  const handleAttributeDescriptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAttributeDescription(event.target.value);
    },
    []
  );

  /**
   * Manage the attribute type
   */
  const [attributeType, setAttributeType] = useState<AttributeAttributeTypeEnum | null>(null);
  const handleAttributeTypeChange = useCallback((updatedType: string | null) => {
    setAttributeType(updatedType as AttributeAttributeTypeEnum);
  }, []);

  /**
   * Manage the attribute is required
   */
  const [isRequired, setIsRequired] = useState(false);
  const handleIsRequiredChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setIsRequired(event.target.checked);
  }, []);

  /**
   * Clear the form when the modal is opened
   */
  useEffect(() => {
    setShortCode('');
    setAttributeName('');
    setAttributeDescription('');
    setAttributeType(null);
    setIsRequired(false);
  }, [visible]);

  /**
   * Handle form acceptance
   */
  const disabledHint = useMemo(() => {
    if (!attributeName) {
      return 'Attribute name is required';
    }

    if (!attributeType) {
      return 'Attribute type is required';
    }

    return '';
  }, [attributeName, attributeType]);
  const [loading, setLoading] = useState(false);
  const handleConfirm = useCallback(async () => {
    try {
      setLoading(true);
      setLoading(true);
      if (!attributeName) {
        throw new Error('Attribute name is missing');
      }
      if (!attributeType) {
        throw new Error('Attribute type is missing');
      }

      await apiSdk.createAttribute({
        attribute_name: attributeName,
        attribute_description: attributeDescription,
        attribute_type: attributeType,
        is_required: isRequired,
        short_code: shortCode,
      });
      await query.refetch();
      toast.success('Attribute created successfully');
      onClose();
    } catch (error) {
      toast.error(`Failed to create attribute: ${parseAxiosError(error)}`);
    } finally {
      setLoading(false);
    }
  }, [
    attributeDescription,
    attributeName,
    attributeType,
    isRequired,
    shortCode,
    apiSdk,
    query,
    onClose,
  ]);

  return (
    <Dialog open={visible} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Attribute</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography>
              Please provide the attribute's basic information to create their account.
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Attribute Name"
              type="text"
              value={attributeName}
              onChange={handleAttributeNameChange}
              placeholder="Enter the attribute's name"
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Short Code"
              type="text"
              value={shortCode}
              onChange={handleShortCodeChange}
              placeholder="Enter the attribute's short code"
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Attribute Description"
              type="text"
              value={attributeDescription}
              onChange={handleAttributeDescriptionChange}
              placeholder="Enter the attribute's description"
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <Custom.Checkbox
              label="Is Required"
              name="isRequired"
              checked={isRequired}
              onChange={handleIsRequiredChange}
            />
          </Grid>
          <Grid item xs={6}>
            <Custom.Select
              label="Attribute Type"
              name="attributeType"
              value={attributeType}
              onChange={handleAttributeTypeChange}
              options={[
                { value: AttributeAttributeTypeEnum.String, label: 'String' },
                { value: AttributeAttributeTypeEnum.Number, label: 'Number' },
                { value: AttributeAttributeTypeEnum.Boolean, label: 'Boolean' },
                { value: AttributeAttributeTypeEnum.Date, label: 'Date' },
              ]}
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
          Create Attribute
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
