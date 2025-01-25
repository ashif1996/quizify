import dotenv from "dotenv";
dotenv.config();

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";

import { Types } from "mongoose";
import User, { UserDocument} from "../models/userModel.js";
import QuizHistory from "../models/quizHistoryModel.js";

import httpStatusCodes from "../utils/httpStatusCodes.js";
import showFlashMessages from "../utils/messageUtils.js";
import { fetchUserId } from "../utils/userUtils.js";
import generateQuizId from "../utils/quizUtils.js";
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
    isVerified: boolean;
    role: string;
}

interface CustomJwtPayload extends JwtPayload {
    questions: {
        question: string;
        correct_answer: string;
        incorrect_answers: string[];
    }[];
}

const getUserLogin = (req: Request, res: Response) => {
    const locals: Locals = { title: "User Login | Quizify" };
    res.status(httpStatusCodes.OK).render("users/login", {
        locals,
        layout: "layouts/authLayout",
    });
};

const userLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email })
            .select("_id firstName lastName email password isVerified role")
            .lean();

        if (!user) {
            return showFlashMessages({
                req,
                res,
                message: "User not found.",
                status: httpStatusCodes.NOT_FOUND,
                redirectUrl: "/users/login",
            });
        }

        const isPasswordMatch: boolean = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return showFlashMessages({
                req,
                res,
                message: "Password does not match.",
                status: httpStatusCodes.UNAUTHORIZED,
                redirectUrl: "/users/login",
            });
        }

        const payload: JwtPayload = {
            userId: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role,
        };

        const token: string = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 });

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

const userLogout = (req: Request, res: Response) => {
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

const getUserSignup = (req: Request, res: Response) => {
    const locals: Locals = { title: "User Signup | Quizify" };
    res.status(httpStatusCodes.OK).render("users/signup", {
        locals,
        layout: "layouts/authLayout",
    });
};

const userSignup = async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    try {
        const isExistingUser = await User.exists({ email });
        if (isExistingUser) {
            return showFlashMessages({
                req,
                res,
                message: "Email is already registered.",
                status: httpStatusCodes.BAD_REQUEST,
                redirectUrl: "/users/signup",
            });
        }

        if (password !== confirmPassword) {
            return showFlashMessages({
                req,
                res,
                message: "Passwords do not match.",
                status: httpStatusCodes.BAD_REQUEST,
                redirectUrl: "/users/signup",
            });
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

const verifyEmail = async (req: Request, res: Response) => {
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

const resendVerificationEmail = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email })
            .select("email verificationToken verificationTokenExpires");

        if (!user) {
            return showFlashMessages({
                req,
                res,
                message: "No user found with this email address.",
                status: httpStatusCodes.NOT_FOUND,
                redirectUrl: "/users/user-profile",
            });
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

const getUserProfile = async (req: Request, res: Response) => {
    const locals: Locals = { title: "User Profile | Quizify" };

    try {
        const userId = fetchUserId(req);
        const user = await User.findById(userId)
            .select("firstName lastName email role isVerified totalPoints createdAt")
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

const selectQuizOptions = (req: Request, res: Response) => {
    const locals: Locals = { title: "Quiz Options | Quizify" };

    try {
        const categories = [
            { id: 9, name: "General Knowledge" },
            { id: 10, name: "Entertainment: Books" },
            { id: 11, name: "Entertainment: Film" },
            { id: 12, name: "Entertainment: Music" },
            { id: 13, name: "Entertainment: Musicals & Theatres" },
            { id: 14, name: "Entertainment: Television" },
            { id: 15, name: "Entertainment: Video Games" },
            { id: 16, name: "Entertainment: Board Games" },
            { id: 17, name: "Science & Nature" },
            { id: 18, name: "Science: Computers" },
            { id: 19, name: "Science: Mathematics" },
            { id: 20, name: "Mythology" },
            { id: 21, name: "Sports" },
            { id: 22, name: "Geography" },
            { id: 23, name: "History" },
            { id: 24, name: "Politics" },
            { id: 25, name: "Art" },
            { id: 26, name: "Celebrities" },
            { id: 27, name: "Animals" },
            { id: 28, name: "Vehicles" },
            { id: 29, name: "Entertainment: Comics" },
            { id: 30, name: "Science: Gadgets" },
            { id: 31, name: "Entertainment: Japanese Anime & Manga" },
            { id: 32, name: "Entertainment: Cartoon & Animations" },
        ];      
    
        const difficulties = ["easy", "medium", "hard"];

        res.render("users/quiz-options", {
            locals,
            categories,
            difficulties,
            layout: "layouts/mainLayout",
        });
    } catch (error) {
        console.error("An internal error occurred:", error as Error);
        showFlashMessages({
            req,
            res,
            message: "An unexpected error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/users/quiz-options",
        });
    }
};

const getQuizQuestions = async (req: Request, res: Response) => {
    const locals: Locals = { title: "Quiz Questions | Quizify" };
    const { category, difficulty } = req.body;

    try {
        if (!category || !difficulty) {
            showFlashMessages({
                req,
                res,
                message: "Please select both category and difficulty.",
                status: httpStatusCodes.BAD_REQUEST,
                redirectUrl: "/users/quiz-options",
            });
        }

        const token = req.cookies.authToken;
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as CustomJwtPayload;
        
        const apiUrl = `https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}&type=multiple`;
        const response = await axios.get(apiUrl);

        // Check for response code from OpenTDB
        if (response.data.response_code !== 0) {
            return showFlashMessages({
                req,
                res,
                message: "No questions found for the provided parameters.",
                status: httpStatusCodes.NOT_FOUND,
                redirectUrl: "/users/user-profile",
            });
        }

        const quizQuestions = response.data.results;
        const newToken = jwt.sign(
            { 
                ...decoded,
                questions: quizQuestions,
            },
            process.env.JWT_SECRET,
        );

        res.cookie("authToken", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24,
            sameSite: "strict",
        });

        res.render("users/quiz", {
            locals,
            newToken,
            questions: quizQuestions,
            layout: "layouts/mainLayout",
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

const submitQuiz = async (req: Request, res: Response) => {
    const locals: Locals = { title: "Quiz Result | Quizify" };
    const userAnswers = req.body;

    try {
        const token = req.cookies.authToken;
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as CustomJwtPayload;
        const questions = decoded.questions;
        const userId = decoded.userId;

        let correctAnswerCount = 0;
        const resultData: object[] = [];

        questions.forEach((question, index) => {
            const userAnswer = userAnswers[`question-${index}`];

            resultData.push({ 
                questionNumber: index + 1,
                answer: question.correct_answer,
                userAnswer: userAnswer || "Not Answered",
            });

            if (userAnswer && userAnswer === question.correct_answer) {
                correctAnswerCount++;
            }
        });

        const totalScore = correctAnswerCount * 5;
        const quizId = generateQuizId(decoded.firstName);

        const quizData = await QuizHistory.findOneAndUpdate(
            { userId: userId, quizId: quizId },
            {
                $set: {
                    quizId: quizId,
                    score: totalScore,
                    completedAt: new Date(),
                }
            },
            { upsert: true, new: true },
        );

        await User.findByIdAndUpdate(
            userId,
            {
                $inc: { totalPoints: totalScore },
                $push: { quizHistory: quizData._id },
            },
            { new : true },
        );

        res.render("users/quiz-result", {
            locals,
            correct: correctAnswerCount,
            resultData,
            layout: "layouts/mainLayout",
        });
    } catch (error) {
        console.error("An internal error occurred:", error as Error);
        showFlashMessages({
            req,
            res,
            message: "An unexpected error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/users/quiz-questions",
        });
    }
};

const getQuizHistory = async (req: Request, res: Response) => {
    const locals: Locals = { title: "Quiz History | Quizify" };

    try {
        const userId = fetchUserId(req);

        const page = parseInt(req.query.page as string) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const userQuizHistory = await User.findOne({ _id: userId })
            .select("quizHistory")
            .populate({
                path: "quizHistory",
                select: "quizId score completedAt",
                options: {
                    sort: { completedAt: -1 },
                    skip,
                    limit,
                },
            })
            .lean();

        const totalItems = userQuizHistory?.quizHistory.length || 0;
        const totalPages = Math.ceil(totalItems / limit);

        res.status(httpStatusCodes.OK).render("users/quiz-history", {
            locals,
            quizHistory: userQuizHistory?.quizHistory,
            currentPage: page,
            totalPages: totalPages,
            layout: "layouts/mainLayout",
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

export default {
    getUserLogin,
    userLogin,
    userLogout,
    getUserSignup,
    userSignup,
    verifyEmail,
    resendVerificationEmail,
    getUserProfile,
    selectQuizOptions,
    getQuizQuestions,
    submitQuiz,
    getQuizHistory,
};