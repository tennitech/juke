import {useState, createContext, useContext, useEffect, useCallback} from "react";
import { SpotifyAuthContext, performFetch, performPut } from "../contexts/spotify";
import defaultAlbumArt from '../assets/default-art-placeholder.svg';


const Player = ({ children }) => {
  const { playbackReady, accessToken, invalidateAccess } = useContext(SpotifyAuthContext);

  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(false);
  const [online, setOnline] = useState(false);
  const [active, setActive] = useState(false);
  const [track, setTrack] = useState(null);
  const [paused, setPaused] = useState(true);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [recentlyPlayedError, setRecentlyPlayedError] = useState(null);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  //TODO Refactor a lot of this listener logic
  useEffect(() => {
    if (accessToken && playbackReady && !player && window.Spotify) {
      console.log("Constructing player");

      try {
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
      } catch (error) {
        console.error("Error initializing Spotify player:", error);
      }
    }
  }, [accessToken, playbackReady, player]);

  /**
   * Backend Requirements for Recently Played Tracks:
   * 
   * This frontend code calls Spotify's /me/player/recently-played endpoint which requires:
   * 1. A valid Spotify access token in the Authorization header
   * 2. Returns up to 20 most recently played tracks
   * 
   * Backend Team Needs to:
   * - Implement token refresh mechanism to ensure valid access tokens
   * - Consider caching recently played tracks to reduce API calls
   * - Handle rate limiting (Spotify allows 1 request/sec)
   * - Implement error handling for expired/invalid tokens
   * - Consider implementing a proxy endpoint to hide Spotify credentials
   *   Example: /api/recently-played instead of calling Spotify directly
   * 
   * Relevant Documentation: https://developer.spotify.com/documentation/web-api/reference/get-recently-played
   */
  const fetchRecentlyPlayed = () => {
    if (accessToken) {
      setIsLoadingRecent(true);

      performFetch("https://api.spotify.com/v1/me/player/recently-played", { limit: 10 }, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched recently played:", response);

          if (response && response.items) {
            // Transform the data to match our UI needs
            const transformedTracks = response.items
              .filter((item) => item && item.track && item.track.album)
              .map((item) => ({
                id: item.track.id,
                title: item.track.name,
                artist: item.track.artists[0].name,
                imageUrl: item.track.album.images[0]?.url || defaultAlbumArt,
                playedAt: new Date(item.played_at),
                // Add any additional track data you need
                albumName: item.track.album.name,
                duration: item.track.duration_ms,
                uri: item.track.uri
              }))
              .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())

            setRecentlyPlayed(transformedTracks);
          }
        })
        .catch((error) => {
          console.log(setRecentlyPlayed);
          console.log(typeof(setRecentlyPlayed));
          console.error("Failed to fetch recently played:", error);
          setRecentlyPlayedError(error);
        })
        .finally(() => {
          setIsLoadingRecent(false);
        });
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchRecentlyPlayed();

      // Optional: Set up polling to keep recently played list updated
      const pollInterval = setInterval(fetchRecentlyPlayed, 30000); // 30 seconds

      return () => clearInterval(pollInterval);
    }
  }, [accessToken]);

  //Use effect to keep track of the current Track.
  useEffect(() => {
    if (!player) return;

    const syncTrack = () => {
      player.getCurrentState().then((state) => {
        if (state && state.track_window.current_track) {
          setTrack(state.track_window.current_track);
          console.log("Setting Track: " + JSON.stringify(state.track_window.current_track));
          // console.log(recentlyPlayed);
          setPaused(state.paused);
          setActive(!!state);
        }
      }).catch((err) => console.error("Error getting player state:", err));
    };

    // Sync track on player state change
    player.addListener("player_state_changed", syncTrack);

    return () => {
      player.removeListener("player_state_changed", syncTrack);
    };
  }, [player]);

  //TODO: Do better error catching

  const togglePlay = useCallback(() => {
    if(player==null){
      return; // Just catch when its null. Prevents runtime errors
    }
    player.togglePlay().then(() => {
      console.log("Toggle Play");
    });
  }, []);


  const nextTrack = useCallback(() => {
    if(player==null){
      return; // Just catch when its null. Prevents runtime errors
    }
    player.nextTrack().then(() => {
      console.log('Skipped to next track!');
    });
  }, []);

  const prevTrack = useCallback(() => {
    if(player==null){
      return; // Just catch when its null. Prevents runtime errors
    }
    player.previousTrack().then(() => {
      console.log('Set to previous track!');
    });
  }, []);

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
        playUri,
        nextTrack,
        prevTrack,
        recentlyPlayed,
        recentlyPlayedError,
        isLoadingRecent
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
  playUri: () => {},
  nextTrack: () => {},
  prevTrack: () => {},
  recentlyPlayed: [],
  recentlyPlayedError: null,
  isLoadingRecent: true
});
