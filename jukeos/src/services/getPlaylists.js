import axios from 'axios';


const token = "";
const [playlists, setPlaylists] = useState([]);

const getPlaylists = async () => {
    const { data } = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    setPlaylists(data.items);

    return (
        <div className="App">
          <header className="App-header">
            <h1>Spotify Playlists</h1>
            {!token ? (
              <a
                href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`}
              >
                Login to Spotify
              </a>
            ) : (
              <button onClick={logout}>Logout</button>
            )}
            {token && (
              <button onClick={getPlaylists}>Get Playlists</button>
            )}
            <ul>
              {playlists.map(playlist => (
                <li key={playlist.id}>{playlist.name}</li>
              ))}
            </ul>
          </header>
        </div>
    );
};


export default getPlaylists;