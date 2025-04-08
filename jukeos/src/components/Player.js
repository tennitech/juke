import {useState, createContext, useContext, useEffect, useCallback} from "react";
import { SpotifyAuthContext, performFetch, performPost, performPut } from "../contexts/spotify";
import defaultAlbumArt from '../assets/default-art-placeholder.svg';


const Player = ({ children }) => {
  const { playbackReady, accessToken, invalidateAccess } = useContext(SpotifyAuthContext);

  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState("");
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
    }
  }, [accessToken]);

  // Mutex to prevent simultaneous player state events from adding to queue multiple times
  let addingQueue = false;

  //Use effect to keep track of the current Track.
  useEffect(() => {
    if (!player) return;

    const syncTrack = () => {
      player.getCurrentState().then((state) => {
        if (state && state.track_window.current_track) {
          console.log(track?.uri !== state.track_window.current_track.uri);
          if (track?.uri !== state.track_window.current_track.uri) {
            fetchRecentlyPlayed();
          }
          setTrack(state.track_window.current_track);
          console.log("Setting Track: " + JSON.stringify(track));
          setPaused(state.paused);
          setActive(!!state);

          if (state.track_window.next_tracks.length == 0 && !addingQueue) {
            addingQueue = true;
            // TODO: Get 2 similar song recommendations from Harmony
            // let songs = queryHarmony(state.track_window.current_track, recentlyPlayed);
            // For now, hard code in the top 5 songs on spotify right now
            // Seems like spotify only lets us add up to 2 songs at a time without encountering strange bugs
            
            let songs = [
              "Lady Gaga, Bruno Mars - Die With A Smile",
              "ROSÉ, Bruno Mars - APT.",
              "Billie Eilish - BIRDS OF A FEATHER",
              "Doechii - Anxiety",
              "Alex Warren - Ordinary"
            ];

            var song1 = songs[Math.floor(Math.random() * songs.length)];
            var song2 = songs[Math.floor(Math.random() * songs.length)];
            songs = songs.filter((song) => song == song1 || song == song2);

            let songPromises = songs.map(async (song) => {
              try {
                const response = await performFetch(
                  `https://api.spotify.com/v1/search?q=${song}&type=track&limit=1`,
                  {},
                  accessToken,
                  invalidateAccess
                );

                if (response.tracks.items.length === 0) {
                  console.error("No results found for query:", song);
                  return "";
                }

                await performPost(
                  `https://api.spotify.com/v1/me/player/queue`,
                  {
                    "device_id": deviceId,
                    "uri": response.tracks.items[0].uri
                  },
                  null,
                  accessToken, invalidateAccess
                );
                console.log("Added uri " + response.tracks.items[0].uri + " with popularity " + response.tracks.items[0].popularity + " to queue");

                return response.tracks.items[0].uri;
              } catch (err) {
                console.error("Error getting recommendations:", err);
                return "";
              }
            });

            Promise.all(songPromises).then(() => {
              addingQueue = false;
            });
          }
        }
      }).catch((err) => console.error("Error getting player state:", err));
    };

    // Sync track on player state change
    player.addListener("player_state_changed", syncTrack);

    return () => {
      player.removeListener("player_state_changed", syncTrack);
    };
  }, [player, track, deviceId]);

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
