import { NextFunction, Request, Response, Router } from "express";
const router = Router();
import cookie from "cookie";

router.get("/search/tracks", async (req: Request, res: Response) => {
  try {
    const { accessToken } = res.locals.spotifyUserData;
    //  ||
    // JSON.parse(cookie.parse(req?.headers?.cookie).spotifyUserData)
    //   .accessToken;
    if (!accessToken) return res.sendStatus(403);
    const { query, countryCode, limit } = req.query;
    const response = await (
      await fetch(
        `https://api.spotify.com/v1/search?q=${query}&limit=${
          limit ?? 5
        }&country=${countryCode}&type=track`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
    ).json();
    if (response.error) {
      console.error(response);
      res.send(response.message).status(response.status);
      return;
    }
    const tracks = response.tracks.items.map((t: any) => {
      return {
        mp3PreviewUrl: t.preview_url,
        id: t.id,
        url: t.external_urls.spotify,
        title: t.name as string,
        uri: t.uri as string,
        artist: {
          id: t.artists[0].id,
          name: t.artists[0].name,
          url: t.artists[0].external_urls.spotify as string,
        },
        album: {
          name: t.album.name,
          id: t.album.id,
          largeImageUrl: t.album.images[0].url as string,
          smallImageUrl: t.album.images[t.album.images.length - 1]
            .url as string,
          releaseYear: parseInt(t.album.release_date.split("-")[0]),
        },
      };
    });
    res.send(tracks);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

router.get("/search/artists", async (req: Request, res: Response) => {
  try {
    const { accessToken } = res.locals.spotifyUserData;
    // || JSON.parse(cookie.parse(req.headers.cookie).spotifyUserData).accessToken;
    if (!accessToken) return res.sendStatus(403);

    const { query, countryCode, limit } = req.query;
    const response = await (
      await fetch(
        `https://api.spotify.com/v1/search?q=${query}&limit=${
          limit ?? 5
        }&country=${countryCode}&type=artist`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
    ).json();
    const artists = response.artists.items.map((t: any) => {
      return {
        id: t.id,
        name: t.name,
        largeImageUrl: t.images[1]?.url ?? undefined,
        smallImageUrl:
          (t.images[t.images.length - 1]?.url as string) ?? undefined,
      };
    });
    if (response.error) {
      console.error(response);
      res.send(response.message).status(response.status);
      return;
    } else {
      res.send(artists);
    }
  } catch (e) {
    res.sendStatus(500);
    console.error(e);
  }
});

router.post("/getRecommendations", async (req: Request, res: Response) => {
  try {
    const {
      trackIDs,
      artistIDs,
      genre,
      duplicateTrackIDsToAvoid,
      limit,
      onlyIncludeFromArtistID,
      targetYear,
      countryCode,
    } = req.body;
    const trackIDsArePresent = trackIDs?.length > 0;
    const artistIDsArePresent = artistIDs?.length > 0;
    const { accessToken } = res.locals.spotifyUserData;
    //  ||
    // JSON.parse(cookie.parse(req?.headers?.cookie).spotifyUserData)
    //   .accessToken;
    if (!accessToken) return res.sendStatus(403);
    let recommendedTracks: any[];
    if (onlyIncludeFromArtistID !== undefined) {
      const response = await (
        await fetch(
          `https://api.spotify.com/v1/artists/${onlyIncludeFromArtistID}/top-tracks?market=${countryCode}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
      ).json();
      recommendedTracks = response.tracks;
    } else {
      const response = await (
        await fetch(
          `https://api.spotify.com/v1/recommendations?market=${countryCode}${
            trackIDsArePresent ? `&seed_tracks=${trackIDs.join(",")}` : ""
          }${
            artistIDsArePresent ?? false
              ? `&seed_artists=${`${artistIDs.join(",")}`}`
              : ""
          }${genre ? `&seed_genres=${genre}` : ""}&limit=100`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
      ).json();
      recommendedTracks = response.tracks;
    }

    const tracksWithoutDuplicates = recommendedTracks.filter(
      (mP) => !duplicateTrackIDsToAvoid.includes(mP.id)
    );

    if (tracksWithoutDuplicates.length < limit) {
      const { tracks }: { tracks: any[] } = await (
        await fetch(
          `https://api.spotify.com/v1/recommendations?market=${countryCode}${
            trackIDsArePresent ? `&seed_tracks=${trackIDs.join(",")}` : ""
          }${
            artistIDsArePresent ?? false
              ? `&seed_artists=${`${[
                  ...artistIDs,
                  onlyIncludeFromArtistID,
                ].join(",")}`}`
              : ""
          }${genre ? `&seed_genres=${genre}` : ""}&limit=100`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
      ).json();
      tracksWithoutDuplicates.push(
        ...tracks
          .filter(
            (t) =>
              ![
                ...duplicateTrackIDsToAvoid,
                ...tracksWithoutDuplicates,
              ].includes(t.id)
          )
          .sort((a, b) => {
            return a.artists.find((a) => a.id === onlyIncludeFromArtistID) !==
              undefined
              ? 1
              : 0;
          })
      );
    }
    // const sortedTracks = tracksWithoutDuplicates.sort((a: Track, b: Track) => {
    //   {
    //     const diffA = Math.abs(a.album.releaseYear - targetYear);
    //     const diffB = Math.abs(b.album.releaseYear - targetYear);
    //     // Sort by the difference, with smaller differences coming first
    //     return diffA - diffB;
    //   }
    // });
    const mappedTracks = tracksWithoutDuplicates.map((t: any) => {
      return {
        album: {
          id: t.id,
          largeImageUrl: (t.album.images[0]?.url as string) ?? undefined,
          smallImageUrl:
            (t.album.images[t.album.images.length - 1]?.url as string) ??
            undefined,
          name: t.album.name,
          releaseYear: parseInt(t.album.release_date.split("-")[0]),
        },
        artist: {
          id: t.artists[0].id,
          name: t.artists[0].name,
          url: t.artists[0].external_urls.spotify,
        },
        title: t.name,
        uri: t.uri,
        url: t.external_urls.spotify,
        id: t.id,
        mp3PreviewUrl: t.preview_url,
      };
    });

    return res.send({ tracks: mappedTracks.splice(0, limit) });
  } catch (e) {
    res.send(e);
    console.error(e);
  }
});

router.post(
  "/createPlaylist",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;
      const {
        id,
        external_urls: { spotify: playlistUrl },
      } = await (
        await fetch(
          `https://api.spotify.com/v1/users/${res.locals.spotifyUserData.userId}/playlists`,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Bearer ${res.locals.spotifyUserData.accessToken}`,
            },
            body: JSON.stringify({
              name,
              description: "Generated by Alive Inside App",
              public: true,
            }),
          }
        )
      ).json();
      const response = { url: playlistUrl, id };
      res.send(response);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/getTrack', (req: Request, res: Response, next: NextFunction) => {
  
})

router.post(
  "/addTracksToPlaylist",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { trackURIs, position, playlistId } = req.body;
      fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=${trackURIs.join(
          ","
        )}${position ? `&position=${position}` : ""}`,
        {
          headers: { Authorization: `Bearer ${res.locals.accessToken}` },
        }
      );
      res.send({});
    } catch (error) {
      res.send({ error });
      next(error);
    }
  }
);

export default router;
