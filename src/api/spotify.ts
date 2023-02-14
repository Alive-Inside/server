import { NextFunction, Request, Response, Router } from "express";
const router = Router();
import cookie from "cookie";
import { chunk, uniq } from "lodash";

router.get("/search/tracks", async (req: Request, res: Response) => {
  const TRACK_SEARCH_MINIMUM = 15;
  try {
    const { accessToken } = res.locals.spotifyUserData;
    //  ||
    // JSON.parse(cookie.parse(req?.headers?.cookie).spotifyUserData)
    //   .accessToken;
    if (!accessToken) return res.sendStatus(403);
    const { query, countryCode, limit } = req.query;
    let limitToInclude: number;
    if (limit) {
      const limitAsNumber = parseInt(limit as string);
      limitToInclude =
        limitAsNumber < TRACK_SEARCH_MINIMUM
          ? TRACK_SEARCH_MINIMUM
          : limitAsNumber;
    } else {
      limitToInclude = TRACK_SEARCH_MINIMUM;
    }
    const response = await (
      await fetch(
        `https://api.spotify.com/v1/search?q=${query}&limit=${limitToInclude}&country=${countryCode}&type=track&include_external=audio`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
    ).json();
    if (response.error) {
      console.error(response);
      res.send(response.message).status(response.status);
      return;
    }
    console.log(response.tracks.items.map((x) => x.artists));
    const uniqueTracks: any[] = [];
    for (const track of response.tracks.items) {
      const duplicates = uniqueTracks.filter(
        (t) => t.artists[0].name === track.artists[0].name
      );
      if (duplicates.length === 0) uniqueTracks.push(track);
    }

    const limitedTracks = uniqueTracks.splice(0, parseInt(limit as string));
    const mappedTracks = limitedTracks.map((t: any) => {
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
    res.send(mappedTracks);
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
            method: "POST",
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

router.get(
  "/getTrack",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { trackId } = req.body;
      const response = await (
        await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: {
            Authorization: `Bearer ${res.locals.spotifyUserData.accessToken}`,
          },
        })
      ).json();
      const responseObj = {
        mp3PreviewUrl: response.preview_url,
        id: response.id,
        url: response.external_urls.spotify,
        title: response.name as string,
        uri: response.uri as string,
        artist: {
          id: response.artists[0].id,
          name: response.artists[0].name,
          url: response.artists[0].external_urls.spotify as string,
        },
        album: {
          name: response.album.name,
          id: response.album.id,
          largeImageUrl: response.album.images[0].url as string,
          smallImageUrl: response.album.images[response.album.images.length - 1]
            .url as string,
          releaseYear: parseInt(response.album.release_date.split("-")[0]),
        },
      };
      res.send(responseObj);
    } catch (e) {
      res.sendStatus(500);
    }
  }
);

router.post(
  "/addTracksToPlaylist",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { trackURIs, position, playlistId } = req.body;
      const trackURIChunks = chunk(trackURIs, 25);
      for (const trackURIChunk of trackURIChunks) {
        const trackURIs = trackURIChunk.join(",");
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=${trackURIs}${
            position ? `&position=${position}` : ""
          }`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${res.locals.spotifyUserData.accessToken}`,
            },
          }
        );
      }
      res.sendStatus(200);
    } catch (error) {
      console.error(error);
      res.send({ error });
      next(error);
    }
  }
);

export default router;
