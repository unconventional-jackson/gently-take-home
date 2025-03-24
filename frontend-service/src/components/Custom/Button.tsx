import { Button as MuiButton, ButtonProps as MuiButtonProps, Tooltip } from '@mui/material';
import { useMemo } from 'react';
interface ButtonProps extends MuiButtonProps {
  disabledHint?: string;
  successHint?: string;
}
export function Button({ disabledHint, successHint, ...props }: ButtonProps) {
  const hint = useMemo(() => {
    if (disabledHint && props.disabled) {
      return disabledHint;
    }
    if (successHint && !props.disabled) {
      return successHint;
    }
    return '';
  }, [disabledHint, successHint, props.disabled]);

  return (
    <Tooltip title={hint}>
      <span>
        <MuiButton variant="contained" {...props} />
      </span>
    </Tooltip>
  );
}
