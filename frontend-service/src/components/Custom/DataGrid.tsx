import { Box, styled } from '@mui/material';
import {
  GridRowClassNameParams,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridValidRowModel,
} from '@mui/x-data-grid';
import { Button } from './Button';
import { Refresh } from '@mui/icons-material';
import { DataGridPremium } from '@mui/x-data-grid-premium';
import { formattedMsAgo } from '../../utils/time';
import { useMemo } from 'react';
import { UseQueryResult } from '@tanstack/react-query';

export const StyledDataGrid = styled(DataGridPremium)({
  '& .custom-table-row': {
    backgroundColor: 'var(--color-bw-white)',
    transition: 'background-color 0.3s',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'var(--color-alternate-secondary)',
    },
  },
  '& .MuiDataGrid-columnHeaderTitleContainerContent': {
    flex: 1,
  },
});

/**
 * MUI
 */
// eslint-disable-next-line react-refresh/only-export-components, @typescript-eslint/no-unused-vars
export const getRowClassName = (_params: GridRowClassNameParams<GridValidRowModel>) => {
  return 'custom-table-row';
};

/**
 * MUI
 */
export function CustomToolbar(props: { queries?: UseQueryResult<unknown>[]; export?: boolean }) {
  const refreshedAt = useMemo(() => {
    if (props.queries?.some((query) => query.isFetching)) {
      return 'Refreshing...';
    }
    if (!props.queries?.some((query) => query.dataUpdatedAt)) {
      return 'Never';
    }
    const now = new Date();
    const past = new Date(props.queries.find((query) => query.dataUpdatedAt)?.dataUpdatedAt ?? 0);
    const msAgo = Math.floor(now.getTime() - past.getTime());
    return `Updated: ${formattedMsAgo(msAgo)}`;
  }, [props.queries]);

  return (
    <GridToolbarContainer sx={{ gap: 1, p: 1 }}>
      <GridToolbarColumnsButton slotProps={{ button: { variant: 'outlined' } }} />
      <GridToolbarFilterButton slotProps={{ button: { variant: 'outlined' } }} />
      <GridToolbarDensitySelector
        slotProps={{
          tooltip: { title: 'Change density' },
          button: { variant: 'outlined' },
        }}
      />
      <Box sx={{ flexGrow: 1 }} />
      {props.export && (
        <GridToolbarExport
          slotProps={{
            tooltip: { title: 'Export data' },
            button: { variant: 'outlined' },
          }}
        />
      )}
      {props.queries?.length && (
        <Button
          startIcon={<Refresh />}
          onClick={() => props.queries?.forEach((query) => query.refetch())}
          size="small"
          variant="outlined"
          loading={props.queries.some((query) => query.isFetching)}
        >
          {refreshedAt}
        </Button>
      )}
    </GridToolbarContainer>
  );
}
