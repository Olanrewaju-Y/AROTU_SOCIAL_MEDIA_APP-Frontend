import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

/**
 * A route guard that checks authentication, token validity, and optionally user roles.
 *
 * @param {object} props
 * @param {React.Element} props.element - The component to render if allowed.
 * @param {string} [props.requiredRole] - Optional role (e.g., 'admin') required to access this route.
 * @returns {React.Element}
 */
const ProtectedRoute = ({ element, requiredRole }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();
    if (isExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return (
        <Navigate
          to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
          replace
        />
      );
    }

    if (requiredRole) {
      const parsedUser = JSON.parse(user);
      const userRole = parsedUser?.role;
      if (userRole !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
      }
    }

    return element;
  } catch (err) {
    console.error('❌ Invalid token:', err);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }
};

export default ProtectedRoute;
