import React from 'react';
import { useNavigate, useLocation, useSearchParams, useParams, Navigate } from 'react-router-dom';

function resolvePath(pathOrObject) {
  if (typeof pathOrObject === 'string') return pathOrObject;
  if (pathOrObject && pathOrObject.pathname) {
    const params = pathOrObject.params;
    if (params && Object.keys(params).length > 0) {
      const query = new URLSearchParams(params).toString();
      return `${pathOrObject.pathname}?${query}`;
    }
    return pathOrObject.pathname;
  }
  return '/';
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (path) => navigate(resolvePath(path)),
    replace: (path) => navigate(resolvePath(path), { replace: true }),
    back: () => navigate(-1),
    navigate: (path) => navigate(resolvePath(path)),
  };
}

export function useSegments() {
  const location = useLocation();
  return location.pathname.split('/').filter(Boolean);
}

export function useLocalSearchParams() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  return { ...Object.fromEntries(searchParams.entries()), ...params };
}

export function Redirect({ href }) {
  return <Navigate to={href} replace />;
}
