import { Chip, Typography } from '@mui/material';
import {
  AttributeAttributeTypeEnum,
  Product,
  ProductAttributeLookup,
} from '@unconventional-jackson/gently-openapi-service';
import { useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { parseAxiosError } from '../../utils/errors';
import { useSdk } from '../../api/sdk';
import { UseQueryResult } from '@tanstack/react-query';

interface ProductAttributeProps {
  productAttributeLookup: ProductAttributeLookup;
  query: UseQueryResult<Product, Error>;
}

export function ProductAttribute({ productAttributeLookup, query }: ProductAttributeProps) {
  const apiSdk = useSdk();
  const handleDeleteProductAttribute = useCallback(async () => {
    try {
      if (!productAttributeLookup.product_id) {
        throw new Error('Product ID is required');
      }
      if (!productAttributeLookup.attribute_id) {
        throw new Error('Attribute ID is required');
      }
      if (!productAttributeLookup.product_attribute_lookup_id) {
        throw new Error('Product attribute lookup ID is required');
      }
      await apiSdk.deleteProductAttribute(
        productAttributeLookup.product_id,
        productAttributeLookup.attribute_id,
        productAttributeLookup.product_attribute_lookup_id
      );
      await query.refetch();
      toast.success('Product attribute deleted successfully');
    } catch (error) {
      toast.error(`Failed to delete product attribute: ${parseAxiosError(error)}`);
    }
  }, [apiSdk, productAttributeLookup]);

  const handleEditProductAttribute = useCallback(() => {
    console.log('edit product attribute');
  }, []);

  const labelColor = useMemo(() => {
    if (productAttributeLookup.attribute?.attribute_type === AttributeAttributeTypeEnum.String) {
      return 'primary';
    }
    if (productAttributeLookup.attribute?.attribute_type === AttributeAttributeTypeEnum.Number) {
      return 'secondary';
    }
    if (productAttributeLookup.attribute?.attribute_type === AttributeAttributeTypeEnum.Boolean) {
      return 'success';
    }
    if (productAttributeLookup.attribute?.attribute_type === AttributeAttributeTypeEnum.Date) {
      return 'warning';
    }
    return 'default';
  }, [productAttributeLookup.attribute?.attribute_type]);

  return (
    <Chip
      variant="outlined"
      color={labelColor}
      onDelete={handleDeleteProductAttribute}
      onClick={handleEditProductAttribute}
      label={
        <Typography variant="body1">
          <strong>{productAttributeLookup.attribute?.attribute_name}</strong>&nbsp;{' '}
          {productAttributeLookup.attribute?.attribute_type === AttributeAttributeTypeEnum.String
            ? productAttributeLookup.attribute_value
            : productAttributeLookup.attribute?.attribute_type === AttributeAttributeTypeEnum.Number
              ? productAttributeLookup.attribute_value
              : productAttributeLookup.attribute?.attribute_type ===
                  AttributeAttributeTypeEnum.Boolean
                ? productAttributeLookup.attribute_value === 'true'
                  ? 'Yes'
                  : 'No'
                : productAttributeLookup.attribute?.attribute_type ===
                    AttributeAttributeTypeEnum.Date &&
                  (productAttributeLookup.attribute_value
                    ? new Date(productAttributeLookup.attribute_value).toLocaleDateString()
                    : 'Unknown')}
        </Typography>
      }
    />
  );
}
