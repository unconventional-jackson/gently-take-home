import {
  FormControlLabel,
  FormGroup,
  Checkbox as MuiCheckbox,
  CheckboxProps,
  Tooltip,
  FormControlLabelProps,
  Grid2,
  InputLabel,
  Typography,
} from '@mui/material';
import { PropsWithChildren, useMemo } from 'react';

type CustomCheckboxProps = PropsWithChildren<
  Omit<CheckboxProps, 'label'> &
    Omit<FormControlLabelProps, 'onChange' | 'control' | 'label'> & {
      id?: string;
      tabIndex?: number;
      /**
       * If provided, the label will be displayed above the checkbox
       */
      label?: string;
      disabledHint?: string;
      /**
       * The content displayed beside the checkbox
       */
      caption?: string;
      /**
       * The content displayed below the checkbox
       */
      helperText?: string;
    }
>;

export function Checkbox({
  id,
  tabIndex,
  label,
  children,
  caption,
  helperText,

  ...props
}: CustomCheckboxProps) {
  const labelSx = useMemo(() => {
    return {
      fontSize: '0.85rem',
      fontWeight: 500,
      marginBottom: '0.15rem',
    };
  }, []);
  return (
    <Tooltip title={props.disabled && props.disabledHint ? props.disabledHint : ''}>
      <Grid2 container>
        <Grid2 size={{ xs: 12 }}>
          <InputLabel shrink={false} htmlFor={props.name}>
            <Typography sx={labelSx}>{label}</Typography>
          </InputLabel>
          <FormGroup>
            <FormControlLabel
              checked={!!props.checked || !!props.value}
              control={
                <MuiCheckbox
                  id={id}
                  tabIndex={tabIndex}
                  checked={props.checked}
                  value={!!props.checked || props.value}
                  {...props}
                />
              }
              label={caption ?? children ?? label ?? id}
            />
          </FormGroup>
          {helperText && (
            <Typography variant="caption" color="text.secondary">
              {helperText}
            </Typography>
          )}
        </Grid2>
      </Grid2>
    </Tooltip>
  );
}
