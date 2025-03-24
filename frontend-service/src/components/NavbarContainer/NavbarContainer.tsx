import './NavbarContainer.css';

import { PropsWithChildren } from 'react';

export function NavbarContainer({ children }: PropsWithChildren<unknown>) {
  return <div className="navbar-container">{children}</div>;
}
