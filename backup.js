/*
    This pulls the list of recently played tracks by the current user. If gets the name and the images of the 
    recently played tracks and put them into `setRecentlyPlayed`.

    Relevant Documentation: https://developer.spotify.com/documentation/web-api/reference/get-recently-played
  */
    const fetchRecentlyPlayed = () => {
        if (accessToken) {
          performFetch("https://api.spotify.com/v1/me/player/recently-played", {}, accessToken, invalidateAccess)
            .then((response) => {
              console.log("Successfully fetched recently played tracks:", response);
    
              if (response && response.items) {
                setRecentlyPlayed(
                  response.items
                    .filter((track) => track && track.track && track.track.album && track.track.album.name && track.track.album.images)
                    .map((track) => ({
                      title: track.track.album.name, 
                      imageUrl: selectBestImage(track.track.album.images).url
                    }))
                );
              }
            }).catch((error) => {
              console.log("Failed to fetch recently played tracks:", error);
          });
        }
      }