import React, { useState, useEffect } from 'react';

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerID = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return function cleanup() {
      clearInterval(timerID);
    };
  });

  return (
    <div>
      <h2>Current Time:</h2>
      <p>{time.toLocaleTimeString()}</p>
    </div>
  );
}

export default Clock;
