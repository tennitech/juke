import React from 'react';

import { requestUserAuthorization } from '../services/spotify';

const Home = () => {
  return (
    <div>
      <button onClick={() => requestUserAuthorization()}>Login</button>
    </div>
  );
};

export default Home;
