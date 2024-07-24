const getAuthToken = async (code) => {
    try {
      const response = await fetch('http://localhost:3001/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  };
  
  export default getAuthToken;
  