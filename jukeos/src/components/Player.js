import {useState, createContext, useContext, useEffect, useCallback} from "react";
import { SpotifyAuthContext, performPut } from "../contexts/spotify";


const Player = ({ children }) => {
  const { playbackReady, accessToken, invalidateAccess } = useContext(SpotifyAuthContext);

  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [online, setOnline] = useState(false);
  const [active, setActive] = useState(false);
  const [track, setTrack] = useState(null);
  const [paused, setPaused] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [deviceActivated, setDeviceActivated] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playingUri, setPlayingUri] = useState(null);
  const [currentPlaybackState, setCurrentPlaybackState] = useState(null);
  const [activationAttempts, setActivationAttempts] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize Spotify SDK
  useEffect(() => {
    if (!playbackReady || sdkReady) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      setSdkReady(true);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [playbackReady, sdkReady]);

  // Initialize player when SDK is ready
  useEffect(() => {
    if (!sdkReady || !accessToken || player) return;

    const newPlayer = new window.Spotify.Player({
      name: 'JukeOS Player',
      getOAuthToken: cb => { cb(accessToken); },
      volume: 0.5
    });

    // Error handling
    newPlayer.addListener('initialization_error', ({ message }) => {
      console.error('Failed to initialize:', message);
      setPlayerReady(false);
    });

    newPlayer.addListener('authentication_error', ({ message }) => {
      console.error('Failed to authenticate:', message);
      setPlayerReady(false);
    });

    newPlayer.addListener('account_error', ({ message }) => {
      console.error('Failed to validate Spotify account:', message);
      setPlayerReady(false);
    });

    newPlayer.addListener('playback_error', ({ message }) => {
      console.error('Failed to perform playback:', message);
    });

    // Playback status updates
    newPlayer.addListener('player_state_changed', state => {
      if (!state) return;
      setCurrentPlaybackState(state);
      setTrack(state.track_window.current_track);
      setPaused(state.paused);
    });

    // Ready
    newPlayer.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      setDeviceId(device_id);
      setPlayerReady(true);
      setOnline(true);
    });

    // Not Ready
    newPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
      setOnline(false);
      setPlayerReady(false);
    });

    // Connect to the player
    newPlayer.connect().then(success => {
      if (success) {
        console.log('Successfully connected to Spotify!');
        setPlayer(newPlayer);
      }
    });

    return () => {
      if (newPlayer) {
        newPlayer.disconnect();
      }
    };
  }, [sdkReady, accessToken]);

  // Activate the device when player is ready
  useEffect(() => {
    let isMounted = true;
    let retryTimeout;

    const activateDevice = async () => {
      if (!deviceId || !accessToken || !playerReady || activationAttempts >= 3 || isInitializing) return;
      
      setIsInitializing(true);
      try {
        // Transfer playback to our device
        await performPut(
          'https://api.spotify.com/v1/me/player',
          {},
          {
            device_ids: [deviceId],
            play: false
          },
          accessToken,
          invalidateAccess
        );
        
        if (isMounted) {
          console.log("Device activated");
          setDeviceActivated(true);
          setActivationAttempts(0);
          setIsInitializing(false);

          // If we have a current playback state, restore it
          if (currentPlaybackState && !currentPlaybackState.paused) {
            try {
              await performPut(
                `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
                {},
                {
                  uris: [currentPlaybackState.track_window.current_track.uri],
                  position_ms: currentPlaybackState.position
                },
                accessToken,
                invalidateAccess
              );
              console.log("Playback restored");
            } catch (playbackError) {
              console.error("Failed to restore playback:", playbackError);
            }
          }
        }
      } catch (error) {
        console.error("Failed to activate device:", error);
        if (isMounted) {
          setDeviceActivated(false);
          setIsInitializing(false);
          // Only retry on rate limiting or server errors
          if (error.response?.status === 429 || error.response?.status === 500) {
            setActivationAttempts(prev => prev + 1);
            // Exponential backoff for retries
            retryTimeout = setTimeout(() => {
              if (isMounted) {
                activateDevice();
              }
            }, Math.min(1000 * Math.pow(2, activationAttempts), 8000));
          }
        }
      }
    };

    activateDevice();

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [deviceId, accessToken, playerReady, invalidateAccess, currentPlaybackState, activationAttempts, isInitializing]);

  const playUri = async (uri) => {
    if (!deviceId || !playerReady) {
      console.error("Device not ready for playback", { deviceId, deviceActivated, playerReady });
      return;
    }

    console.log("Attempting to play:", uri);
    setPlayingUri(uri);

    try {
      // If device isn't activated, try to activate it first
      if (!deviceActivated) {
        console.log("Device not activated, attempting to activate...");
        await performPut(
          'https://api.spotify.com/v1/me/player',
          {},
          {
            device_ids: [deviceId],
            play: false
          },
          accessToken,
          invalidateAccess
        );
        setDeviceActivated(true);
      }

      // Then start playback
      const body = uri.startsWith("spotify:track:")
        ? { "uris": [uri] }
        : { "context_uri": uri };

      await performPut(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {},
        body,
        accessToken,
        invalidateAccess
      );

      console.log("Playback started");
      
      // Finally, ensure the player is playing
      if (player) {
        await player.resume();
      }
    } catch (error) {
      console.error("Playback error:", error);
      if (error.response?.status === 404) {
        console.log("Device not found, attempting to reconnect");
        setDeviceActivated(false);
        if (player) {
          try {
            const connected = await player.connect();
            if (connected) {
              setPlayerReady(true);
              // Wait a moment for the device to be ready
              setTimeout(() => playUri(uri), 1000);
            }
          } catch (reconnectError) {
            console.error("Reconnection failed:", reconnectError);
          }
        }
      }
    }
  };

  const togglePlay = useCallback(() => {
    if (!player) return;

    player.togglePlay().then(() => {
      player.getCurrentState().then(state => {
        if (state) {
          setPaused(state.paused);
        }
      });
    });
  }, [player]);

  const nextTrack = useCallback(() => {
    if (!player) return;

    player.nextTrack().then(() => {
      player.getCurrentState().then(state => {
        if (state) {
          setTrack(state.track_window.current_track);
          setPaused(state.paused);
        }
      });
    });
  }, [player]);

  const prevTrack = useCallback(() => {
    if (!player) return;

    player.previousTrack().then(() => {
      player.getCurrentState().then(state => {
        if (state) {
          setTrack(state.track_window.current_track);
          setPaused(state.paused);
        }
      });
    });
  }, [player]);

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
        deviceReady: deviceActivated && playerReady,
        playingUri
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
  deviceReady: false,
  playingUri: null
});
