import { CopyAll } from '@mui/icons-material';
import {
  Box,
  Grid2,
  IconButton,
  InputLabel,
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useMemo } from 'react';
import { parseAxiosError } from '../../utils/errors';
import { toast } from 'react-toastify';
type InputProps = MuiTextFieldProps & {
  disabledHint?: string;
  successHint?: string;
  copyValue?: string | null;
  copyLabel?: string | null;
};
export function CustomInput({
  disabledHint,
  successHint,
  label,
  copyValue,
  copyLabel,
  ...props
}: InputProps) {
  const labelSx = useMemo(() => {
    return {
      fontSize: '0.85rem',
      fontWeight: 500,
      marginBottom: '0.15rem',
    };
  }, []);

  const hint = useMemo(() => {
    if (disabledHint && props.disabled) {
      return disabledHint;
    }
    if (successHint && !props.disabled) {
      return successHint;
    }
    return '';
  }, [disabledHint, successHint, props.disabled]);

  /**
   * Copy the updated by user ID to the clipboard - useful for searching in the CRM or support w/ engineering
   */
  const handleCopyToClipboard = useCallback(() => {
    if (!copyValue) {
      return;
    }
    navigator.clipboard
      .writeText(copyValue)
      .then(() => {
        toast.info(`Copied ${copyLabel} to clipboard`);
      })
      .catch((error) => {
        toast.error(`Failed to copy ${copyLabel} to clipboard: ${parseAxiosError(error)}`);
      });
  }, [copyValue, copyLabel]);

  return (
    <Tooltip title={hint}>
      <Grid2 container>
        <Grid2 size={{ xs: 12 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box flexGrow={1}>
              <InputLabel shrink={false} htmlFor={props.name}>
                <Typography sx={labelSx}>{label}</Typography>
              </InputLabel>
              <MuiTextField
                {...props}
                size="small"
                fullWidth
                slotProps={{
                  ...props.slotProps,
                  inputLabel: {
                    ...props.slotProps?.inputLabel,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore The MUI internal types don't percolate up through slotProps
                    shrink: true,
                  },
                  formHelperText: {
                    ...props.slotProps?.formHelperText,
                    sx: {
                      marginLeft: 0,
                    },
                  },
                }}
              />
            </Box>
            {copyValue && copyLabel && (
              <Box>
                <Typography sx={labelSx}>&nbsp;</Typography>
                <IconButton onClick={handleCopyToClipboard} disabled={!copyValue}>
                  <CopyAll />
                </IconButton>
              </Box>
            )}
          </Box>
        </Grid2>
      </Grid2>
    </Tooltip>
  );
}

export const Input = CustomInput;
