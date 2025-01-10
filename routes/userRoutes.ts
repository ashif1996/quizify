import express from "express";
const router = express.Router();

import userControllers from "../controllers/userControllers.js";

router.route("/login")
    .get(userControllers.getUserLogin)
    .post(userControllers.userLogin);

router.get("/logout", userControllers.userLogout);

router.route("/signup")
    .get(userControllers.getUserSignup)
    .post(userControllers.userSignup);

router.get("/verify-email", userControllers.verifyEmail);
router.get("/resend-verification-email", userControllers.resendVerificationEmail);

router.get("/user-profile", userControllers.getUserProfile);

export default router;