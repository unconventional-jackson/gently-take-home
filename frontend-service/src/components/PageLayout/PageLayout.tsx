import './PageLayout.css';

import { PropsWithChildren } from 'react';

export function PageLayout({ children }: PropsWithChildren<unknown>) {
  return <div className="page-layout">{children}</div>;
}
