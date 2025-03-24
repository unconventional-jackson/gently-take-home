import {
  Autocomplete,
  Grid2,
  InputLabel,
  ListItemText,
  MenuItem,
  TextField,
  TextFieldProps,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type SelectOption = {
  value: string;
  label: string;
  annotation?: string;
};

type SelectProps = Omit<TextFieldProps, 'onChange'> & {
  id?: string;
  disabledHint?: string;
  successHint?: string;
  onChange?: (value: string | null) => void;
  onSearch?: (value: string) => Promise<void>;
  options?: SelectOption[];
  value?: string | null;
};

export function Select({
  id,
  tabIndex,
  disabledHint,
  successHint,
  label,
  options = [],
  value: initialValue,
  onChange,
  onSearch,
  ...props
}: SelectProps) {
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

  const [value, setValue] = useState<SelectOption | null>(null);

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, value: SelectOption | null) => {
      setValue(value);
      onChange?.(value?.value ?? null);
    },
    [onChange]
  );

  useEffect(() => {
    if (initialValue !== null) {
      const option = options.find((option) => option.value === initialValue);
      setValue(option ?? null);
    } else if (initialValue === null) {
      setValue(null);
    }
  }, [initialValue, options]);

  const [, setInputValue] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, value: string) => {
      setInputValue(value);
      onSearch?.(value);
    },
    [onSearch]
  );

  return (
    <Tooltip title={hint}>
      <Grid2 container>
        <Grid2 size={{ xs: 12 }}>
          <InputLabel shrink={false} htmlFor={props.name}>
            <Typography sx={labelSx}>{label}</Typography>
          </InputLabel>
          <Autocomplete
            options={options}
            // onInputChange={handleInputChange}
            // filterOptions={(options, state) => {
            //   console.log('options', options, state);
            //   return options;
            // }}
            autoComplete
            openOnFocus
            disabled={props.disabled}
            // filterSelectedOptions
            onChange={handleChange}
            value={value}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                {...props}
                fullWidth
                size="small"
                variant="outlined"
                tabIndex={tabIndex}
                id={id}
                slotProps={{
                  ...props.slotProps,
                  select: {
                    ...props.slotProps?.select,
                    disabled: props.disabled,
                    size: 'small',
                  },
                  input: {
                    ...params.InputProps,
                    ...props.slotProps?.input,
                    disabled: props.disabled,
                    size: 'small',
                  },
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
            )}
            renderOption={(props, option) => {
              return (
                <MenuItem {...props} key={option.value} value={option.value}>
                  <ListItemText
                    style={{
                      margin: 0,
                    }}
                  >
                    {option.label}
                  </ListItemText>
                  {option.annotation && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {option.annotation}
                    </Typography>
                  )}
                </MenuItem>
              );
            }}
          />
        </Grid2>
      </Grid2>
    </Tooltip>
  );
}
