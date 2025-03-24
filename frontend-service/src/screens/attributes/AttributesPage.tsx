import { Delete, Refresh } from '@mui/icons-material';
import { Box, Container, Divider, Grid, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  GridColDef,
  GridPaginationMeta,
  GridPaginationModel,
  GridRowParams,
  GridRowsProp,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
} from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { Attribute } from '@unconventional-jackson/gently-openapi-service';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useSdk } from '../../api/sdk';
import { CustomButton } from '../../components/Button/Button';
import { StyledDataGrid } from '../../components/DataGrid';
import { MainContent } from '../../components/MainContent/MainContent';
import { PageLayout } from '../../components/PageLayout/PageLayout';
import { useDebugContext } from '../../contexts/DebugContext';
import { parseAxiosError } from '../../utils/errors';
import { CreateAttributeModal } from './CreateAttributeModal';
import { DeleteAttributeModal } from './DeleteAttributeModal';

/**
 * Page to display all attributes
 */
export function AttributesPage() {
  const apiSdk = useSdk();
  const navigate = useNavigate();

  const [offset, setOffset] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);

  const { debug } = useDebugContext();
  const columns: GridColDef<Attribute>[] = useMemo(
    () => [
      ...(debug ? [{ field: 'attribute_id', headerName: 'Attribute ID', width: 100 }] : []),
      {
        field: 'attribute_name',
        headerName: 'Attribute Name',
        width: 100,
      },
      {
        field: 'attribute_description',
        headerName: 'Attribute Description',
        width: 250,
      },
      {
        field: 'attribute_type',
        headerName: 'Attribute Type',
        width: 100,
      },
      {
        field: 'short_code',
        headerName: 'Short Code',
        width: 100,
      },
      {
        field: 'is_required',
        headerName: 'Is Required',
        width: 100,
        valueGetter: (value) => (value ? 'Yes' : 'No'),
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        type: debug ? 'dateTime' : 'date',
        valueGetter: (value) => value && new Date(value),
      },
      {
        field: 'updated_at',
        headerName: 'Updated At',
        type: debug ? 'dateTime' : 'date',
        valueGetter: (value) => value && new Date(value),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 130,
        getActions: (params: GridRowParams<Attribute>) => [
          <GridActionsCellItem
            icon={<Delete />}
            showInMenu={false}
            label="Delete"
            onClick={() => {
              setSelectedAttribute(params.row);
              setDeleteModalOpen(true);
            }}
          />,
        ],
      },
    ],
    [debug, navigate]
  );

  const query = useQuery({
    queryKey: ['getAttributes', { offset, limit }],
    queryFn: async () => {
      try {
        const response = await apiSdk.getAttributes(offset, limit);

        return response.data;
      } catch (error) {
        toast.error(`Failed to fetch attributes: ${parseAxiosError(error)}`);
        throw error;
      }
    },
  });
  const rows: GridRowsProp<Attribute> = useMemo(() => query.data?.items ?? [], [query.data?.items]);

  /**
   * MUI
   */
  const rowCountRef = useRef(query.data?.count ?? 0);
  const rowCount = useMemo(() => {
    if (typeof query.data?.count === 'number') {
      rowCountRef.current = query.data.count;
    }
    return rowCountRef.current;
  }, [query.data?.count]);

  /**
   * MUI
   */
  const handlePaginationModelChange = (newPaginationModel: GridPaginationModel) => {
    setLimit(newPaginationModel.pageSize);
    setOffset(newPaginationModel.page * newPaginationModel.pageSize);
  };

  /**
   * MUI
   */
  const page = useMemo(() => {
    if (typeof offset === 'number' && typeof limit === 'number') {
      return Math.floor(offset / limit);
    }
    return 0;
  }, [offset, limit]);

  /**
   * MUI
   */
  const paginationMetaRef = useRef<GridPaginationMeta>();

  /**
   * MUI
   * Memoize to avoid flickering when the `hasNextPage` is `undefined` during refetch
   */
  const paginationMeta = useMemo(() => {
    const hasNextPage = typeof query.data?.offset === 'number';
    if (hasNextPage && paginationMetaRef.current?.hasNextPage !== hasNextPage) {
      paginationMetaRef.current = { hasNextPage };
    }
    return paginationMetaRef.current;
  }, [query]);

  /**
   * MUI
   */
  const handleRowClick = useCallback(
    (_params: GridRowParams<Attribute>) => {
      console.log('Not Implemented');
    },
    [navigate]
  );

  /**
   * Manage the create attribute modal
   */
  const [isCreateAttributeModalOpen, setIsCreateAttributeModalOpen] = useState(false);
  const handleCreateNewAttribute = useCallback(() => {
    setIsCreateAttributeModalOpen(true);
  }, []);
  const handleCloseCreateAttributeModal = useCallback(() => {
    setIsCreateAttributeModalOpen(false);
  }, []);

  return (
    <PageLayout>
      <Container>
        <Box p={3} padding={5}>
          <Grid container>
            <Grid item xs={12} display="flex" justifyContent="space-between">
              <Typography
                variant="h4"
                gutterBottom
                sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' } }}
              >
                Attributes
              </Typography>
              <Box display="flex" columnGap="1rem">
                <CustomButton variant="contained" onClick={handleCreateNewAttribute}>
                  Create New Attribute
                </CustomButton>
              </Box>
            </Grid>
          </Grid>
        </Box>
        <Divider />
      </Container>
      <MainContent>
        <Container>
          <Box p={3} padding={5}>
            <Grid container spacing={2}>
              <Grid item xs={12} style={{ height: 600 }}>
                <StyledDataGrid
                  rows={rows}
                  columns={columns}
                  loading={query.isFetching}
                  onRowClick={handleRowClick}
                  paginationMode="server"
                  pageSizeOptions={[10, 25, 50, 100]}
                  rowCount={rowCount}
                  paginationMeta={paginationMeta}
                  onPaginationModelChange={handlePaginationModelChange}
                  paginationModel={{
                    page: page,
                    pageSize: limit,
                  }}
                  pagination
                  disableColumnFilter
                  filterMode="client"
                  getRowId={(row) => (row as Attribute).attribute_id ?? ''}
                  initialState={{
                    pinnedColumns: {
                      right: ['actions'],
                    },
                  }}
                  slots={{
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    toolbar: CustomToolbar,
                  }}
                  slotProps={{
                    toolbar: {
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      refresh: query.refetch,
                      isFetching: query.isFetching,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Container>
      </MainContent>
      <CreateAttributeModal
        visible={isCreateAttributeModalOpen}
        onClose={handleCloseCreateAttributeModal}
        query={query}
      />
      <DeleteAttributeModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        attribute={selectedAttribute}
        onDeleted={query.refetch}
      />
    </PageLayout>
  );
}

interface CustomToolbarProps {
  refresh: () => void;
  isFetching: boolean;
}
/**
 * MUI
 */
export function CustomToolbar(props: CustomToolbarProps) {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector slotProps={{ tooltip: { title: 'Change density' } }} />
      <Box sx={{ flexGrow: 1 }} />
      <CustomButton
        variant="text"
        onClick={props.refresh}
        loading={props.isFetching}
        startIcon={<Refresh />}
        size="small"
      >
        Refresh
      </CustomButton>
    </GridToolbarContainer>
  );
}
