import { ExpandMore, Info } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  Divider,
  Grid2,
  Typography,
} from '@mui/material';
import { PropsWithChildren, useState } from 'react';
import { Button } from './Button';

interface SectionProps {
  title: string;
  description: string;
  onInfoClick?: () => void;
  infoIcon?: React.ReactNode;
  iconLabel?: string;
  collapsible?: boolean;
}

export function Section({
  title,
  description,
  children,
  onInfoClick,
  infoIcon = <Info />,
  iconLabel = 'Info',
  collapsible = false,
}: PropsWithChildren<SectionProps>) {
  const [expanded, setExpanded] = useState<boolean>(!collapsible);

  const handleChange = (_: React.SyntheticEvent, isExpanded: boolean) => {
    if (!collapsible) return;
    setExpanded(isExpanded);
  };

  return (
    <Card variant="outlined">
      <Accordion defaultExpanded={!collapsible} expanded={expanded} onChange={handleChange}>
        <AccordionSummary expandIcon={collapsible ? <ExpandMore /> : undefined}>
          <Grid2 container spacing={2} flex={1}>
            <Grid2 size={{ xs: onInfoClick ? 10 : 12 }}>
              <Typography variant="h4">{title}</Typography>
              <Typography variant="body2">{description}</Typography>
            </Grid2>
            {onInfoClick && (
              <Grid2
                size={{ xs: 2 }}
                direction="row"
                display="flex"
                justifyContent="flex-end"
                alignItems="center"
              >
                <Button onClick={onInfoClick} color="primary" startIcon={infoIcon}>
                  {iconLabel}
                </Button>
              </Grid2>
            )}
          </Grid2>
        </AccordionSummary>
        <Divider />
        <AccordionDetails sx={{ p: 2 }}>{children}</AccordionDetails>
      </Accordion>
    </Card>
  );
}
