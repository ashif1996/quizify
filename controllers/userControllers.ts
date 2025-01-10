import dotenv from "dotenv";
dotenv.config();

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { ObjectId } from "mongoose";
import User, { UserDocument} from "../models/userModel.js";
import QuizHistory from "../models/quizHistoryModel.js";

import httpStatusCodes from "../utils/httpStatusCodes.js";
import showFlashMessages from "../utils/messageUtils.js";
import { fetchUserId } from "../utils/userUtils.js";
import {
    generateVerificationToken,
    sendVerificationEmail,
} from "../utils/emailUtils.js";

interface Locals {
    title: string;
}

interface JwtPayload {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
}

const getUserLogin = (req: Request, res: Response): void => {
    const locals: Locals = { title: "User Login | Quizify" };
    res.status(httpStatusCodes.OK).render("users/login", {
        locals,
        layout: "layouts/authLayout",
    });
};

const userLogin = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email })
            .select("_id firstName lastName email password")
            .lean();

        if (!user) {
            showFlashMessages({
                req,
                res,
                message: "User not found.",
                status: httpStatusCodes.NOT_FOUND,
                redirectUrl: "/users/login",
            });
            return;
        }

        const isPasswordMatch: boolean = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            showFlashMessages({
                req,
                res,
                message: "Password does not match.",
                status: httpStatusCodes.UNAUTHORIZED,
                redirectUrl: "/users/login",
            });
            return;
        }

        const payload: JwtPayload = {
            userId: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        };

        const token: string = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: 3600,
        });

        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24,
            sameSite: "strict",
        });

        showFlashMessages({
            req,
            res,
            type: "success",
            status: httpStatusCodes.OK,
            redirectUrl: "/",
        });
    } catch (error) {
        console.error("An internal error occurred:", error as Error);
        showFlashMessages({
            req,
            res,
            message: "An unexpected error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/users/login",
        });
    }
};

const userLogout = (req: Request, res: Response): void => {
    res.clearCookie("authToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    showFlashMessages({
        req,
        res,
        type: "success",
        message: "Logged out successfully.",
        status: httpStatusCodes.OK,
        redirectUrl: "/users/login",
    });
};

const getUserSignup = (req: Request, res: Response): void => {
    const locals: Locals = { title: "User Signup | Quizify" };
    res.status(httpStatusCodes.OK).render("users/signup", {
        locals,
        layout: "layouts/authLayout",
    });
};

const userSignup = async (req: Request, res: Response): Promise<void> => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    try {
        const isExistingUser = await User.exists({ email });
        if (isExistingUser) {
            showFlashMessages({
                req,
                res,
                message: "Email is already registered.",
                status: httpStatusCodes.BAD_REQUEST,
                redirectUrl: "/users/signup",
            });
            return;
        }

        if (password !== confirmPassword) {
            showFlashMessages({
                req,
                res,
                message: "Passwords do not match.",
                status: httpStatusCodes.BAD_REQUEST,
                redirectUrl: "/users/signup",
            });
            return;
        }

        const token: string = generateVerificationToken();

        await User.create({
            firstName,
            lastName,
            email,
            password,
            verificationToken: token,
            verificationTokenExpires: Date.now() + 3600000,
        });

        await sendVerificationEmail(email, token);

        showFlashMessages({
            req,
            res,
            type: "success",
            message: "You have registered successfully. Please verify your email.",
            status: httpStatusCodes.CREATED,
            redirectUrl: "/users/login",
        });
    } catch (error) {
        console.error("An internal error occurred:", error as Error);
        showFlashMessages({
            req,
            res,
            message: "An unexpected error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/users/signup",
        });
    }
};

const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ verificationToken: token })
            .select("_id isVerified verificationToken verificationTokenExpires");

        if (!user) {
            return res.status(httpStatusCodes.BAD_REQUEST).render("users/email-verification-status", {
                title: "Email Verification Failed",
                message: "Invalid or expired verification token. Please request a new verification email.",
                success: false,
                layout: "layouts/authLayout",
            });
        }

        if (user.verificationTokenExpires && Date.now() > user.verificationTokenExpires.getTime()) {
            return res.status(httpStatusCodes.BAD_REQUEST).render("users/email-verification-status", {
                title: "Email Verification Failed",
                message: "Your verification token has expired. Please request a new verification email.",
                success: false,
                layout: "layouts/authLayout",
            });
        }

        await User.updateOne(
            { _id: user._id },
            {
                $set: { isVerified: true },
                $unset: {
                    verificationToken: "",
                    verificationTokenExpires: "",
                },
            },
        );

        res.status(httpStatusCodes.OK).render("users/email-verification-status", {
            title: "Email Verified Successfully",
            message: "Your email has been verified. You can now check your profile.",
            success: true,
            layout: "layouts/authLayout",
        });
    } catch (error) {
        console.log("An internal error occurred during email verification:", error as Error);

        res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).render("users/email-verification-status", {
            title: "Internal Server Error",
            message: "Something went wrong. Please try again later.",
            success: false,
            layout: "layouts/authLayout",
        });
    }
};

const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email })
            .select("email verificationToken verificationTokenExpires");

        if (!user) {
            showFlashMessages({
                req,
                res,
                message: "No user found with this email address.",
                status: httpStatusCodes.NOT_FOUND,
                redirectUrl: "/users/user-profile",
            });
            return;
        }

        const token: string = generateVerificationToken();

        await User.updateOne(
            { email },
            {
                $set: {
                    verificationToken: token,
                    verificationTokenExpires: Date.now() + 3600000,
                }
            }
        );

        await sendVerificationEmail(email, token);

        showFlashMessages({
            req,
            res,
            type: "success",
            message: "Verification email has been send to your email. Please verify your email.",
            status: httpStatusCodes.OK,
            redirectUrl: "/users/user-profile",
        });
    } catch (error) {
        console.error("An internal error occurred:", error as Error);
        showFlashMessages({
            req,
            res,
            message: "An unexpected error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/users/user-profile",
        });
    }
};

const getUserProfile = async (req: Request, res: Response): Promise<void> => {
    const locals: Locals = { title: "User Profile | Quizify" };

    try {
        const userId = fetchUserId(req);
        const user = await User.findById(userId)
            .populate("quizHistory")
            .lean();

        res.status(httpStatusCodes.OK).render("users/profile", {
            locals,
            user,
            layout: "layouts/mainLayout",
        });
    } catch (error) {
        console.error("An internal error occurred:", error as Error);
        showFlashMessages({
            req,
            res,
            message: "An unexpected error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/users/login",
        });
    }
};

export default {
    getUserLogin,
    userLogin,
    userLogout,
    getUserSignup,
    userSignup,
    verifyEmail,
    resendVerificationEmail,
    getUserProfile,
};