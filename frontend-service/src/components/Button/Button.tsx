import {
  Button as MuiLoadingButton,
  ButtonProps as MuiLoadingButtonProps,
  Tooltip,
} from '@mui/material';

interface ButtonProps extends Omit<MuiLoadingButtonProps, 'onClick'> {
  disabledHint?: string;
  successHint?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => unknown;
}
export function CustomButton({ disabledHint, successHint, ...props }: ButtonProps) {
  return (
    <Tooltip
      title={
        props.disabled && disabledHint
          ? disabledHint
          : !props.disabled && successHint
            ? successHint
            : ''
      }
    >
      <span>
        <MuiLoadingButton variant="contained" {...props} style={{ ...props.style }} />
      </span>
    </Tooltip>
  );
}
