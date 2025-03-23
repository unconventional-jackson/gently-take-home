import {
  AttributeType,
  ProductAttributeLookup,
} from '@unconventional-jackson/gently-database-service';

export function getStringSafeAttributeValue(productAttributeLookup: ProductAttributeLookup) {
  if (productAttributeLookup.attribute?.attribute_type === AttributeType.STRING) {
    if (typeof productAttributeLookup.value_string !== 'string') {
      throw new Error('Missing value_string for string attribute');
    }
    return productAttributeLookup.value_string.toString();
  }
  if (productAttributeLookup.attribute?.attribute_type === AttributeType.BOOLEAN) {
    if (typeof productAttributeLookup.value_boolean !== 'boolean') {
      throw new Error('Missing value_boolean for boolean attribute');
    }
    if (productAttributeLookup.value_boolean) {
      return 'true';
    }
    return 'false';
  }
  if (productAttributeLookup.attribute?.attribute_type === AttributeType.NUMBER) {
    if (typeof productAttributeLookup.value_number !== 'number') {
      throw new Error('Missing value_number for number attribute');
    }
    // check if the number is an integer
    if (Number.isInteger(productAttributeLookup.value_number)) {
      return productAttributeLookup.value_number?.toString();
    }
    // check if the number is a float, then round it to 2 decimal places
    if (!Number.isInteger(productAttributeLookup.value_number)) {
      return productAttributeLookup.value_number?.toFixed(2);
    }
  }
  if (productAttributeLookup.attribute?.attribute_type === AttributeType.DATE) {
    if (!(productAttributeLookup.value_date instanceof Date)) {
      throw new Error('Missing value_date for date attribute');
    }
    return productAttributeLookup.value_date.toISOString();
  }
  throw new Error('Invalid attribute type');
}
