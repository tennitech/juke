import { useState, createContext, useContext, useEffect } from "react";
import { SpotifyAuthContext, performPut } from "../contexts/spotify.jsx";


const Player = ({ children }) => {
  const { playbackReady, accessToken, invalidateAccess } = useContext(SpotifyAuthContext);

  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(false);
  const [online, setOnline] = useState(false);
  const [active, setActive] = useState(false);
  const [track, setTrack] = useState(null);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    if (accessToken && playbackReady && !player) {
      console.log("Constructing player");

      // eslint-disable-next-line no-undef
      const p = new Spotify.Player({
        name: "Juke Spotify Player",
        getOAuthToken: (callback) => callback(accessToken)
      });

      setPlayer(p);

      p.addListener("ready", ({ device_id }) => {
        setDeviceId(device_id);

        p.getCurrentState().then((state) => {
          console.log("Id State", state);
        });

        setOnline(true);
      });

      p.addListener("not_ready", ({ device_id }) => {
        setDeviceId(device_id);

        setOnline(false);
      });

      p.addListener("player_state_changed", (state) => {
        if (state) {
          setTrack(state.track_window.current_track);
          setPaused(state.paused);

          p.getCurrentState().then((state) => {
            setActive(!!state);
          });
        }
      });

      p.addListener('initialization_error', ({ message }) => {
        console.error(message);
      });
  
      p.addListener('authentication_error', ({ message }) => {
        console.error(message);
      });
  
      p.addListener('account_error', ({ message }) => {
        console.error(message);
      });

      p.connect();
    }
  }, [accessToken, playbackReady, player]);

  const togglePlay = () => {
    player.togglePlay().then(() => {
      console.log("Toggle Play");
    });
  };

  const playUri = (uri) => {
    console.log("Play", uri, uri.split(":")[1]);

    // context_uri: albums, artists, playlists
    // uris: track uri

    const body =
      uri.startsWith("spotify:track:")
        ? { "uris": [uri] }
        : { "context_uri": uri }

    performPut(
      `https://api.spotify.com/v1/me/player/play`, // TODO: Device id
      {
        "device_id": deviceId
      },
      body,
      accessToken, invalidateAccess
    ).then(() => {
      console.log("Playing");
    });
  };

  return (
    <PlayerContext.Provider value={
      {
        online,
        active,
        paused,
        track,
        togglePlay,
        playUri
      }
    }>
      { children }
    </PlayerContext.Provider>
  );
};


export default Player;

export const PlayerContext = createContext({
  online: false,
  active: false,
  paused: true,
  track: null,
  togglePlay: () => {},
  playUri: () => {}
});
