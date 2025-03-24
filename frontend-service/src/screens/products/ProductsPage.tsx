import { Delete, Edit as EditIcon, Refresh } from '@mui/icons-material';
import { Box, Container, Divider, Grid, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  GridColDef,
  GridFilterItem,
  GridFilterModel,
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
import { Product } from '@unconventional-jackson/gently-openapi-service';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useSdk } from '../../api/sdk';
import { CustomButton } from '../../components/Button/Button';
import { CustomInput } from '../../components/Custom/Input';
import { StyledDataGrid } from '../../components/DataGrid';
import { MainContent } from '../../components/MainContent/MainContent';
import { PageLayout } from '../../components/PageLayout/PageLayout';
import { useDebugContext } from '../../contexts/DebugContext';
import { parseAxiosError } from '../../utils/errors';
import { DeleteProductModal } from './DeleteProductModal';
import { CreateProductModal } from './CreateProductModal';

/**
 * Page to display all products
 */
export function ProductsPage() {
  const apiSdk = useSdk();
  const navigate = useNavigate();

  const [filterModel, setFilterModel] = useState<GridFilterItem[]>([]);

  const [searchParams] = useSearchParams();
  const params = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  const [offset, setOffset] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const handleChangeSearchTerm = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { debug } = useDebugContext();
  const columns: GridColDef<Product>[] = useMemo(
    () => [
      ...(debug ? [{ field: 'product_id', headerName: 'Product ID', width: 100 }] : []),
      {
        field: 'product_name',
        headerName: 'Product Name',
        width: 100,
      },
      {
        field: 'product_description',
        headerName: 'Product Description',
        width: 250,
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
        getActions: (params: GridRowParams<Product>) => [
          <GridActionsCellItem
            icon={<EditIcon />}
            showInMenu={false}
            label="View"
            onClick={() => {
              navigate(`/app/products/${String(params.row.product_id)}`);
            }}
          />,
          <GridActionsCellItem
            icon={<Delete />}
            showInMenu={false}
            label="Delete"
            onClick={() => {
              setSelectedProduct(params.row);
              setDeleteModalOpen(true);
            }}
          />,
        ],
      },
    ],
    [debug, navigate]
  );

  const query = useQuery({
    queryKey: ['getProducts', { offset, limit, params }],
    queryFn: async () => {
      try {
        // const validFilters = filterModel.filter(
        //   (filter) => 'value' in filter && filter.value !== undefined
        // );

        const response = await apiSdk.getProducts(offset, limit, undefined, {
          params,
        });

        return response.data;
      } catch (error) {
        toast.error(`Failed to fetch products: ${parseAxiosError(error)}`);
      }
    },
  });
  const rows: GridRowsProp<Product> = useMemo(() => query.data?.items ?? [], [query.data?.items]);

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
  const handleFilterModelChange = (newFilterModel: GridFilterModel) => {
    if (newFilterModel.items[0].operator === 'isAnyOf') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      newFilterModel.items[0].value = newFilterModel.items[0].value.join(' ');
    }
    setFilterModel(newFilterModel.items);
  };

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
    (params: GridRowParams<Product>) => {
      navigate(`/app/products/${params.row.product_id ?? ''}`);
    },
    [navigate]
  );

  /**
   * Manage the visibility of the create product modal
   */
  const [createProductModalVisible, setCreateProductModalVisible] = useState(false);
  const handleOpenCreateProductModal = useCallback(() => {
    setCreateProductModalVisible(true);
  }, []);
  const handleCloseCreateProductModal = useCallback(() => {
    setCreateProductModalVisible(false);
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
                Products
              </Typography>
              <Box display="flex" columnGap="1rem">
                <CustomButton variant="contained" onClick={handleOpenCreateProductModal}>
                  Create New Product
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
              <Grid item xs={12}>
                <CustomInput
                  label="Search"
                  variant="outlined"
                  placeholder="Search by product name..."
                  fullWidth
                  value={searchTerm}
                  onChange={handleChangeSearchTerm}
                />
              </Grid>
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
                  onFilterModelChange={handleFilterModelChange}
                  filterModel={{
                    items: filterModel,
                  }}
                  filterMode="server"
                  getRowId={(row) => (row as Product).product_id ?? ''}
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
      <CreateProductModal
        visible={createProductModalVisible}
        onClose={handleCloseCreateProductModal}
        query={query}
      />
      <DeleteProductModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        product={selectedProduct}
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
