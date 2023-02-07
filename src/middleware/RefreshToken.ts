import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import { DateTime } from "luxon";
import { BasicAuthHeader } from "../api/spotify-auth";

dotenv.config();

export const FRONTEND_URL =
  (process.env.NODE_ENV === "production" ? "https://" : "http://") +
  "localhost:3000";

export const BACKEND_URL =
  (process.env.NODE_ENV === "production" ? "https://" : "http://") +
  "localhost:" +
  process.env.PORT;

const RefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (
      req.headers.cookie === undefined &&
      req.headers.authorization === undefined
    )
      return res.sendStatus(403);
    const { refreshToken, expiresAt } =
      // JSON.parse(cookie.parse(req.headers.cookie))
      res.locals.spotifyUserData;

    if (+new Date() < +new Date(expiresAt)) return next();

    if (+new Date() < +new Date(expiresAt)) {
      res.clearCookie("spotifyUserData");
      return res.send({ redirect: true });
    }

    console.log("refresh token expired. grabbing new token");

    const response = await (
      await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: BasicAuthHeader(),
        },
      })
    ).json();
    if (response.error) {
      console.error("error getting refresh token");
      console.error(response.error);
    }
    const { access_token: accessToken, expires_in: expiresIn } = response;
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
      sameSite: "none",
      expires: DateTime.local().plus({ days: 60 }).toJSDate(),
    });

    res.locals.spotifyUserData = spotifyUserData;
    next();
  } catch (e) {
    console.error("refresh token issue");
    console.error(e);
    res.redirect(FRONTEND_URL as string);
  }
};

export const RefreshTokenWithNext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken, expiresAt } = JSON.parse(
      // cookie.parse(req.headers.cookie)
      res.locals.spotifyUserData
    );

    if (+new Date() < +new Date(expiresAt)) return next();

    if (+new Date() > +new Date(expiresAt)) {
      res.clearCookie("spotifyUserData");
      return res.send({ redirect: true });
    }

    console.log("refresh token expired. grabbing new token");

    const response = await (
      await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: BasicAuthHeader(),
        },
      })
    ).json();
    if (response.error) {
      console.error("error getting refresh token");
      console.error(response.error);
    }
    const { access_token: accessToken, expires_in: expiresIn } = response;
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

    console.log("new cookie", spotifyUserData);
    res.cookie("spotifyUserData", JSON.stringify(spotifyUserData), {
      secure: true,
      httpOnly: false,
      sameSite: "none",
      expires: DateTime.local().plus({ days: 60 }).toJSDate(),
    });

    res.locals.accessToken = accessToken;
    next();
  } catch (e) {
    console.error("refresh token issue");
    console.error(e);
    res.redirect(FRONTEND_URL as string);
  }
};

export default RefreshToken;
