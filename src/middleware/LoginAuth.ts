import { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import base64url from "base64url";
import jwt from "jsonwebtoken";

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const BACKEND_URL =
  (process.env.NODE_ENV === "production" ? "https://" : "http://") +
  "localhost:" +
  process.env.PORT;

const LoginAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (
      // req.headers.cookie !== undefined ||
      req.headers.authorization !== undefined
    ) {
      const jwtToken = base64url.decode(
        req.headers.authorization?.split(" ")[1]
      );
      const spotifyUserData = jwt.verify(
        jwtToken,
        process.env.JWT_SECRET as string
      );
      res.locals.spotifyUserData = spotifyUserData;
      return next();
    }
    console.log("redirecting to ", FRONTEND_URL);
    res.redirect(FRONTEND_URL as string);
  } catch (e) {
    console.error("Authorization error");
    console.error(e);
    res.redirect(FRONTEND_URL as string);
  }
};

export default LoginAuth;
