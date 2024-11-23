import { useState, createContext, useContext, useEffect } from "react";
import { SpotifyAuthContext } from "../contexts/spotify";

export const PlayerContext = createContext({
  online: false,
  active: false,
  paused: true,
  track: null
});

const Player = ({ children }) => {
  const { playbackReady, accessToken } = useContext(SpotifyAuthContext);

  const [player, setPlayer] = useState(null);
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
        console.log("Device Id:", device_id);

        p.getCurrentState().then((state) => {
          console.log("Id State", state);
        });

        setOnline(true);
      });

      p.addListener("not_ready", ({ device_id }) => {
        console.log("Device Offline ", device_id);

        setOnline(false);
      });

      p.addListener("player_state_changed", (state) => {
        console.log("State Changed", state);

        if (state) {
          console.log("State", state);

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

  useEffect(() => {
    console.log("Update Track", track);
  }, [track]);

  return (
    <PlayerContext.Provider value={
      {
        online,
        active,
        paused,
        track
      }
    }>
      { children }
    </PlayerContext.Provider>
  );
};

export default Player;
