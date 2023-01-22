import { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const BACKEND_URL =
  (process.env.NODE_ENV === "production" ? "https://" : "http://") +
  "localhost:" +
  process.env.PORT;

const LoginAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log('cookie',req.headers.cookie)
  try {
    if (req.headers.cookie !== undefined) return next();
    res.redirect(FRONTEND_URL as string);
  } catch (e) {
    console.error("cookie issue");
    console.error(e);
    res.redirect(FRONTEND_URL as string);
  }
};

export default LoginAuth;
