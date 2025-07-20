import React from 'react';
import RoomsPage from './RoomsPage';

const RoomsPageWrapper = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser?._id || storedUser?.id;

  return <RoomsPage userId={userId} />;
};

export default RoomsPageWrapper;
