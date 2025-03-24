import { styled } from '@mui/material';
import { GridRowClassNameParams, GridValidRowModel } from '@mui/x-data-grid';
import { DataGridPremium } from '@mui/x-data-grid-premium';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const StyledDataGrid = styled(DataGridPremium)({
  '& .custom-table-row': {
    backgroundColor: 'var(--color-bw-white)',
    transition: 'background-color 0.3s',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'var(--color-alternate-secondary)',
    },
  },
});

/**
 * MUI
 */
export const getRowClassName = (_params: GridRowClassNameParams<GridValidRowModel>) => {
  return 'custom-table-row';
};
