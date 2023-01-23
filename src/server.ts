import express, { NextFunction, Request, Response } from "express";
import spotifyAuth, { BasicAuthHeader } from "./api/spotify-auth";
import spotifyApi from "./api/spotify";
import emailApi from "./api/email";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { DateTime } from "luxon";
// import { sendEmail } from "./api/gmail";
import { JWT } from "googleapis-common";
import { google } from "googleapis";
import base64 from "base64-js";
import cookieParser from "cookie-parser";
import RefreshToken from "./middleware/RefreshToken";
import LoginAuth from "./middleware/LoginAuth";

dotenv.config();

const app = express();
app.use(cookieParser());

const port = process.env.PORT || 8080;

export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({credentials: true, origin: FRONTEND_URL}));

const environment = process.env.NODE_ENV === "production" ? "prod" : "dev";
console.log("Frontend URL:", FRONTEND_URL);
app.listen(port, () => {
  console.log(`[${environment}] Backend live on`, port);
});

app.use(spotifyAuth);
app.use(bodyParser.json());
app.use("/api", LoginAuth, RefreshToken, spotifyApi);
app.use(LoginAuth, RefreshToken, emailApi);
