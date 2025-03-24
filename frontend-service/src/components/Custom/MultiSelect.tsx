import {
  Autocomplete,
  Checkbox,
  Chip,
  Grid2,
  InputLabel,
  ListItemText,
  MenuItem,
  TextField,
  TextFieldProps,
  Tooltip,
  Typography,
} from '@mui/material';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

export type MultiSelectOption = {
  value: string;
  label: string;
  annotation?: string;
};

export type MultiSelectProps = Omit<TextFieldProps, 'onChange'> & {
  id?: string;
  disabledHint?: string;
  successHint?: string;
  onChange?: (value: string[]) => void;
  options?: MultiSelectOption[];
  value?: string[] | null;
};

export function MultiSelect({
  id,
  tabIndex,
  disabledHint,
  successHint,
  label,
  options = [],
  onChange,
  value: initialValue,
  ...props
}: MultiSelectProps) {
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

  const [value, setValue] = useState<MultiSelectOption[]>([]);
  const handleChange = useCallback(
    (_event: React.SyntheticEvent, value: MultiSelectOption[] | null) => {
      setValue(value ?? []);
      onChange?.(value?.map((option) => option.value) ?? []);
    },
    [onChange]
  );

  /**
   * Ensure that a value is set when the component is mounted if one is provided
   */
  useEffect(() => {
    if (initialValue !== null) {
      const initialOptions = options.filter((option) => initialValue?.includes(option.value));
      setValue(initialOptions ?? []);
    } else if (initialValue === null) {
      setValue([]);
    }
  }, [initialValue, options]);

  return (
    <Tooltip title={hint}>
      <Grid2 container flex={1}>
        <Grid2 size={{ xs: 12 }}>
          {/* <FormControl
            size="small"
            sx={{
              width: '100%',
            }}
          > */}
          <InputLabel shrink={false} htmlFor={props.name}>
            <Typography sx={labelSx}>{label}</Typography>
          </InputLabel>
          <Autocomplete
            multiple
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
            renderOption={(props, option, { selected }) => {
              return (
                <MenuItem {...props} key={option.value} value={option.value}>
                  <Checkbox checked={selected} />
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
            // Render tags limited to 2, with a + if there are more
            renderTags={(value, getTagProps) => {
              const numTags = value.length;
              const limitTags = 1;

              return (
                <Fragment>
                  {value.slice(0, limitTags).map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={index}
                      label={option.label}
                      size="small"
                    />
                  ))}
                  {numTags > limitTags && ` +${numTags - limitTags}`}
                </Fragment>
              );
            }}
          />
        </Grid2>
      </Grid2>
    </Tooltip>
  );
}
