import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * A wrapper component that checks for user authentication before rendering the 
 * wrapped component. If the user is not authenticated, it redirects them to the 
 * login page.
 * 
 * @param {object} props - The component's props.
 * @param {React.Component} props.element - The component to render if the user is authenticated.
 * @returns {React.Element} The wrapped component if authenticated, otherwise a redirect to the login page.
 */
const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem("token"); // Check for token in localStorage

  return isAuthenticated ? element : <Navigate to="/login" />;
};

export default ProtectedRoute;