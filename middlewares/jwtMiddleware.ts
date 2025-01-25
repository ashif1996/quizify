import dotenv from "dotenv";
dotenv.config();

import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import httpStatusCodes from "../utils/httpStatusCodes.js";
import showFlashMessages from "../utils/messageUtils.js";

// Middleware to authenticate JWT Tokens
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.authToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return showFlashMessages({
            req,
            res,
            message: "Access denied. Please log in.",
            status: httpStatusCodes.UNAUTHORIZED,
            redirectUrl: "/users/login",
        });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error("JWT_SECRET is not defined in the environment variables.");
        return showFlashMessages({
            req,
            res,
            message: "Something went wrong. It's not your fault.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/users/login",
        });
    }

    jwt.verify(
        token,
        jwtSecret,
        (err: jwt.VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    return showFlashMessages({
                        req,
                        res,
                        message: "Session has expired. Please log in again.",
                        status: httpStatusCodes.UNAUTHORIZED,
                        redirectUrl: "/users/login",
                    });
                }

                return showFlashMessages({
                    req,
                    res,
                    message: "Invalid token. Please log in again.",
                    status: httpStatusCodes.UNAUTHORIZED,
                    redirectUrl: "/users/login",
                });
            }

            req.user = decoded;
            next();
        }
    );    
};

export default authenticateJWT;