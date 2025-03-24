import { Navigate } from 'react-router-dom';

import { useAuth } from '../contexts/useAuth';

export function Root() {
  const { authUser } = useAuth();

  if (authUser?.user_id) {
    console.log(authUser);
    return <Navigate to="/app" />;
  }

  return <Navigate to="/sign-in" />;
}
