const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const QuizHistory = require("../models/quizHistoryModel");

const httpStatusCodes = require("../utils/httpStatusCodes");
const showFlashMessages = require("../utils/messageUtils");
const {
    generateVerificationToken,
    sendVerificationEmail,
} = require("../utils/emailUtils");
const { fetchUserId } = require("../utils/userUtils");

const getUserLogin = (req, res) => {
    const locals = { title: "User Login | Quizify" };
    return res.status(httpStatusCodes.OK).render("users/login", {
        locals,
        layout: "layouts/authLayout",
    });
};

const userLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
         const user = await User.findOne({ email });
         if (!user) {
            return showFlashMessages({
                req,
                res,
                message: "User not found.",
                status: httpStatusCodes.NOT_FOUND,
                redirectUrl: "/users/login",
            });
         }

         const isPasswordMatch = await bcrypt.compare(password, user.password);
         if (!isPasswordMatch) {
            return showFlashMessages({
                req,
                res,
                message: "Password does not match.",
                status: httpStatusCodes.UNAUTHORIZED,
                redirectUrl: "/users/login",
            });
         }

         const payload = {
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: 3600,
        });

        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24,
            sameSite: "strict",
        });

        return showFlashMessages({
            req,
            res,
            type: "success",
            message: "Login successful!",
            status: httpStatusCodes.OK,
            redirectUrl: "/",
        });
    } catch (error) {
        console.error("An internal error occurred:", error);
        return showFlashMessages({
            req,
            res,
            message: "An unexpected error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/users/login",
        });
    }
};

const userLogout = (req, res) => {
    res.clearCookie("authToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    return showFlashMessages({
        req,
        res,
        type: "success",
        message: "Logged out successfully.",
        status: httpStatusCodes.OK,
        redirectUrl: "/users/login",
    });
};

const getUserSignup = (req, res) => {
    const locals = { title: "User Signup | Quizify" };
    return res.status(httpStatusCodes.OK).render("users/signup", {
        locals,
        layout: "layouts/authLayout",
    });
};

const userSignup = async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    try {
        const isExistingUser = await User.findOne({ email });
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

        const token = generateVerificationToken();

        const user = new User({
            firstName,
            lastName,
            email,
            password,
            verificationToken: token,
            verificationTokenExpires: Date.now() + 3600000,
        });

        await user.save();
        await sendVerificationEmail(email, token);

        return showFlashMessages({
            req,
            res,
            type: "success",
            message: "You have registered successfully. Please verify your email.",
            status: httpStatusCodes.CREATED,
            redirectUrl: "/users/login",
        });
    } catch (error) {
        console.error("An internal error occurred:", error);
        return showFlashMessages({
            req,
            res,
            message: "An unexpected error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/users/signup",
        });
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(httpStatusCodes.BAD_REQUEST).render("users/email-verification-status", {
                title: "Email Verification Failed",
                message: "Invalid or expired verification token. Please request a new verification email.",
                success: false,
                layout: "layouts/authLayout",
            });
        }

        if (Date.now() > user.verificationTokenExpires) {
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

        return res.status(httpStatusCodes.OK).render("users/email-verification-status", {
            title: "Email Verified Successfully",
            message: "Your email has been verified. You can now check your profile.",
            success: true,
            layout: "layouts/authLayout",
        });
    } catch (error) {
        console.log("An internal error occurred during email verification:", error);

        return res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).render("users/email-verification-status", {
            title: "Internal Server Error",
            message: "Something went wrong. Please try again later.",
            success: false,
            layout: "layouts/authLayout",
        });
    }
};

const resendVerificationEmail = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return showFlashMessages({
                req,
                res,
                message: "No user found with this email address.",
                status: httpStatusCodes.NOT_FOUND,
                redirectUrl: "/users/user-profile",
            });
        }

        const token = generateVerificationToken();

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

        return showFlashMessages({
            req,
            res,
            type: "success",
            message: "Verification email has been send to your email. Please verify your email.",
            status: httpStatusCodes.OK,
            redirectUrl: "/users/user-profile",
        });
    } catch (error) {
        console.error("An internal error occurred:", error);
        return showFlashMessages({
            req,
            res,
            message: "An unexpected error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/users/user-profile",
        });
    }
};

const getUserProfile = async (req, res) => {
    const locals = { title: "User Profile | Quizify" };

    try {
        const userId = await fetchUserId(req);
        const user = await User.findById(userId)
            .populate("quizHistory")
            .lean();

        return res.status(httpStatusCodes.OK).render("users/profile", {
            locals,
            user,
            layout: "layouts/mainLayout",
        });
    } catch (error) {
        console.error("An internal error occurred:", error);
        return showFlashMessages({
            req,
            res,
            message: "An unexpected error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/users/login",
        });
    }
};

module.exports = {
    getUserLogin,
    userLogin,
    userLogout,
    getUserSignup,
    userSignup,
    verifyEmail,
    resendVerificationEmail,
    getUserProfile,
};