import { useMemo } from 'react';
import {
  DateTimePicker as MuiDateTimePicker,
  DateTimePickerProps as MuiDateTimePickerProps,
} from '@mui/x-date-pickers-pro';
import { DateTime } from 'luxon';
import { Grid2, InputLabel, Tooltip, Typography } from '@mui/material';

type DateTimePickerProps = MuiDateTimePickerProps<DateTime, boolean> & {
  disabledHint?: string;
  successHint?: string;
};
export function DateTimePicker({
  label,
  disabledHint,
  successHint,
  ...props
}: DateTimePickerProps) {
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

  return (
    <Tooltip title={hint}>
      <Grid2 container>
        <Grid2 size={{ xs: 12 }}>
          <InputLabel shrink={false} htmlFor={props.name}>
            <Typography sx={labelSx}>{label}</Typography>
          </InputLabel>
          <MuiDateTimePicker
            {...props}
            value={props.value}
            onChange={props.onChange}
            // onClick={handleStopPropagation}
            views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
            sx={{
              width: '100%',
            }}
            slotProps={{
              textField: {
                size: 'small',
              },
              field: {
                clearable: true,
              },
            }}
          />
        </Grid2>
      </Grid2>
    </Tooltip>
  );
}
