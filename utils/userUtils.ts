import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import httpStatusCodes from "../utils/httpStatusCodes.js";
import showFlashMessages from "./messageUtils.js";

const isTokenPresent = (req: Request, res: Response, redirectUrl: string): string | void => {
    const token = req.cookies.authToken || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return showFlashMessages({
            req,
            res,
            message: "Token not found.",
            status: httpStatusCodes.NOT_FOUND,
            redirectUrl: redirectUrl,
        });
    }

    return token;
};

const fetchUserId = (req: Request) => {
    let userId: string | undefined;

    const token = req.cookies.authToken || req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
        try {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            userId = (decodedToken as JwtPayload).userId as string;
        } catch (error) {
            if ((error as Error).name === "TokenExpiredError") {
                console.warn("Token is expired, proceeding as an unauthenticated user.");
            } else {
                console.error("Error verifying token:", error);
            }
        }
    }

    return userId;
};

export {
    isTokenPresent,
    fetchUserId,
};