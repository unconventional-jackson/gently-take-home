import { styled, Card as MuiCard } from '@mui/material';

export const InteractiveCard = styled(MuiCard)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'background-color 0.3s',
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
  },
}));
InteractiveCard.defaultProps = {
  ...InteractiveCard.defaultProps,
  variant: 'outlined',
};
