import cookieParser from "cookie-parser";
import { Router, Request, Response } from "express";
import { DateTime } from "luxon";
import dotenv from "dotenv";
import cookie from "cookie";
import RefreshToken, { RefreshTokenWithNext } from "../middleware/RefreshToken";

dotenv.config();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";
const redirectUri = `${BACKEND_URL}/auth/callback`;

const router = Router();

router.get("/logout", (req: Request, res: Response) => {
  res.clearCookie("spotifyUserData");
  res.redirect(FRONTEND_URL);
});

router.get("/auth/login", (req: Request, res: Response) => {
  console.log("login hit");
  const clientId = process.env.SPOTIFY_CLIENT_ID;

  res.redirect(
    `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=playlist-modify-public%20user-read-email%20streaming%20user-read-playback-state%20user-modify-playback-state%20user-read-private`
  );
});

router.get(
  "/spotify/getCurrentUser",
  RefreshTokenWithNext,
  async (req: Request, res: Response) => {
    console.log("grabbing current user!");
    try {
      if (req.headers.cookie !== undefined) {
        console.log('HAS COOKIES')
        const accessToken = JSON.parse(
          cookie.parse(req.headers.cookie).spotifyUserData
        ).accessToken;

        const currentUserResponse = await (
          await fetch(`https://api.spotify.com/v1/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
        ).json();
        const user = {
          name: currentUserResponse.display_name,
          avatar: currentUserResponse.images[0].url ?? null,
        };
        res.send(user);
      } else {
        console.log("NOPE")
        res.send(undefined);
      }
    } catch (e) {
      res.sendStatus(500);
    }
  }
);

router.get("/auth/callback", async (req: Request, res: Response) => {
  console.log("Callback hit");
  try {
    const code = req.query.code as string;
    const fetchOptions = {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: BasicAuthHeader(),
      },
    };
    const tokenResponse = await (
      await fetch("https://accounts.spotify.com/api/token", fetchOptions)
    ).json();
    if (tokenResponse.error) {
      res.redirect(`${FRONTEND_URL}?login=false`);
    } else {
      const {
        access_token: accessToken,
        expires_in: expiresIn,
        refresh_token: refreshToken,
      } = tokenResponse;

      const currentUserResponse = await (
        await fetch(`https://api.spotify.com/v1/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      ).json();
      const spotifyUserData = {
        userId: currentUserResponse.id,
        countryCode: currentUserResponse.country,
        name: currentUserResponse.display_name,
        email: currentUserResponse.email,
        accessToken,
        refreshToken,
        expiresAt: DateTime.local().plus({ seconds: expiresIn }).toJSDate(),
        avatar: currentUserResponse.images[0] ?? null,
        isPremium: currentUserResponse.product === "premium",
      };
      res.cookie("spotifyUserData", JSON.stringify(spotifyUserData), {
        secure: true,
        httpOnly: false,
        sameSite: 'none',
        expires: DateTime.local().plus({ days: 60 }).toJSDate(),
      });
      res.redirect(FRONTEND_URL as string);
    }
  } catch (e) {
    console.error(e);
    res.redirect(FRONTEND_URL as string);
  }
});

export function BasicAuthHeader() {
  return (
    "Basic " +
    Buffer.from(
      process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
    ).toString("base64")
  );
}

export default router;
