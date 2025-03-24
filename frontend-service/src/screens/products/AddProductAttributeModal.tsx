import { Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import { UseQueryResult, useQuery } from '@tanstack/react-query';
import {
  AttributeAttributeTypeEnum,
  Product,
} from '@unconventional-jackson/gently-openapi-service';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { useSdk } from '../../api/sdk';
import { CustomButton } from '../../components/Button/Button';
import { parseAxiosError } from '../../utils/errors';
import { Custom } from '../../components/Custom';
import { SelectOption } from '../../components/Custom/Select';
import { DateTime } from 'luxon';

interface AddProductAttributeModalProps {
  productId: string;
  visible: boolean;
  onClose: () => void;
  query: UseQueryResult<Product, Error>;
}

export function AddProductAttributeModal({
  productId,
  visible,
  onClose,
  query,
}: AddProductAttributeModalProps) {
  const apiSdk = useSdk();

  /**
   * Manage the selected attribute
   */
  const [selectedAttributeId, setSelectedAttributeId] = useState<string>('');
  const handleChangeSelectedAttributeId = useCallback(
    (updatedSelectedAttributeId: string | null) => {
      setSelectedAttributeId(updatedSelectedAttributeId ?? '');
    },
    []
  );

  /**
   * Use a search term to narrow down the options available for the attribute
   */
  const [searchTerm, setSearchTerm] = useState<string>('');
  const handleSearch = async (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };
  const getAttributesQuery = useQuery({
    queryKey: ['getAttributes', { offset: 0, limit: 5, searchTerm: searchTerm }],
    queryFn: async () => {
      try {
        const response = await apiSdk.getAttributes(0, 5, searchTerm);
        return response.data;
      } catch (error) {
        toast.error(`Failed to get attributes: ${parseAxiosError(error)}`);
        throw error;
      }
    },
  });
  const options = useMemo(() => {
    return (getAttributesQuery.data?.items ?? [])
      .map(
        (attr): SelectOption => ({
          label: attr?.attribute_name ?? '',
          value: attr?.attribute_id ?? '',
          annotation: attr?.attribute_type ? String(attr?.attribute_type) : undefined,
        })
      )
      .filter((option): option is SelectOption => !!option.label && !!option.value);
  }, [getAttributesQuery.data?.items]);

  /**
   * Determine the type of the selected attribute
   */
  const selectedAttributeType = useMemo(() => {
    return getAttributesQuery.data?.items?.find((attr) => attr.attribute_id === selectedAttributeId)
      ?.attribute_type;
  }, [getAttributesQuery.data?.items, selectedAttributeId]);

  /**
   * Manage the attribute value for a string attribute
   */
  const [attributeValueString, setAttributeValueString] = useState<string | null>(null);
  const handleChangeAttributeValueString = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAttributeValueString(event.target.value);
    },
    []
  );

  /**
   * Manage the attribute value for a number attribute (including decimals)
   */
  const [attributeValueNumber, setAttributeValueNumber] = useState<number | null>(null);
  const handleChangeAttributeValueNumber = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const sanitizedValue = event.target.value.replace(/[^0-9.]/g, '');
      setAttributeValueNumber(Number(sanitizedValue));
    },
    []
  );

  /**
   * Manage the attribute value for a boolean attribute
   */
  const [attributeValueBoolean, setAttributeValueBoolean] = useState<boolean | null>(null);
  const handleChangeAttributeValueBoolean = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAttributeValueBoolean(event.target.checked);
    },
    []
  );

  /**
   * Manage the attribute value for a date attribute
   */
  const [attributeValueDate, setAttributeValueDate] = useState<DateTime | null>(null);
  const handleChangeAttributeValueDate = useCallback((dateTime: DateTime | null) => {
    setAttributeValueDate(dateTime);
  }, []);

  /**
   * Any time the attribute type changes, update the attribute value
   */
  useEffect(() => {
    if (selectedAttributeType !== AttributeAttributeTypeEnum.String) {
      setAttributeValueString(null);
    }
    if (selectedAttributeType !== AttributeAttributeTypeEnum.Number) {
      setAttributeValueNumber(null);
    }
    if (selectedAttributeType !== AttributeAttributeTypeEnum.Boolean) {
      setAttributeValueBoolean(null);
    }
    if (selectedAttributeType !== AttributeAttributeTypeEnum.Date) {
      setAttributeValueDate(null);
    }
  }, [selectedAttributeType]);

  /**
   * Clear the form when the modal is opened
   */
  useEffect(() => {
    setSelectedAttributeId('');
    setAttributeValueString(null);
    setAttributeValueNumber(null);
    setAttributeValueBoolean(null);
    setAttributeValueDate(null);
  }, [visible]);

  /**
   * Handle form acceptance
   */
  const disabledHint = useMemo(() => {
    if (!selectedAttributeId) {
      return 'Attribute is required';
    }

    if (!selectedAttributeType) {
      return 'Attribute type is required';
    }

    if (selectedAttributeType === AttributeAttributeTypeEnum.String && !attributeValueString) {
      return 'Text value is required';
    }

    if (
      selectedAttributeType === AttributeAttributeTypeEnum.Number &&
      attributeValueNumber === null
    ) {
      return 'Numeric value is required';
    }

    if (
      selectedAttributeType === AttributeAttributeTypeEnum.Boolean &&
      attributeValueBoolean === null
    ) {
      return 'Yes / No value is required';
    }

    if (selectedAttributeType === AttributeAttributeTypeEnum.Date && attributeValueDate === null) {
      return 'Date value is required';
    }

    return '';
  }, [
    selectedAttributeId,
    selectedAttributeType,
    attributeValueString,
    attributeValueNumber,
    attributeValueBoolean,
    attributeValueDate,
  ]);
  const [loading, setLoading] = useState(false);
  const handleConfirm = useCallback(async () => {
    try {
      setLoading(true);
      setLoading(true);

      let attribute_value: string = '';
      if (selectedAttributeType === AttributeAttributeTypeEnum.String) {
        attribute_value = attributeValueString ?? '';
      }
      if (selectedAttributeType === AttributeAttributeTypeEnum.Number) {
        attribute_value = attributeValueNumber?.toString() ?? '';
      }
      if (selectedAttributeType === AttributeAttributeTypeEnum.Boolean) {
        attribute_value = attributeValueBoolean ? 'true' : 'false';
      }
      if (selectedAttributeType === AttributeAttributeTypeEnum.Date) {
        attribute_value = attributeValueDate?.toUTC()?.toISO() ?? '';
      }

      if (!attribute_value) {
        throw new Error('Attribute value is required');
      }

      await apiSdk.addProductAttribute(productId, selectedAttributeId, {
        attribute_id: selectedAttributeId,
        attribute_value,
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
    apiSdk,
    query,
    onClose,
    selectedAttributeId,
    selectedAttributeType,
    attributeValueString,
    attributeValueNumber,
    attributeValueBoolean,
    attributeValueDate,
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
          <Grid item xs={12}>
            <Custom.Select
              label="Attribute"
              value={selectedAttributeId}
              onChange={handleChangeSelectedAttributeId}
              onSearch={handleSearch}
              options={options}
              placeholder="Search for an attribute"
              required
              fullWidth
            />
          </Grid>
          {selectedAttributeType === AttributeAttributeTypeEnum.String && (
            <Grid item xs={12}>
              <Custom.Input
                label="Text Value"
                value={attributeValueString}
                onChange={handleChangeAttributeValueString}
                fullWidth
              />
            </Grid>
          )}
          {selectedAttributeType === AttributeAttributeTypeEnum.Number && (
            <Grid item xs={12}>
              <Custom.Input
                label="Numeric Value"
                value={attributeValueNumber}
                onChange={handleChangeAttributeValueNumber}
                fullWidth
              />
            </Grid>
          )}
          {selectedAttributeType === AttributeAttributeTypeEnum.Boolean && (
            <Grid item xs={12}>
              <Custom.Checkbox
                label="Yes / No Value"
                value={attributeValueBoolean}
                onChange={handleChangeAttributeValueBoolean}
              />
            </Grid>
          )}
          {selectedAttributeType === AttributeAttributeTypeEnum.Date && (
            <Grid item xs={12}>
              <Custom.DateTimePicker
                label="Date Value"
                value={attributeValueDate}
                onChange={handleChangeAttributeValueDate}
              />
            </Grid>
          )}
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
          Add Attribute to Product
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
