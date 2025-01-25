import express from "express";
const router = express.Router();

import userControllers from "../controllers/userControllers.js";
import jwtMiddleware from "../middlewares/jwtMiddleware.js";

router.route("/login")
    .get(userControllers.getUserLogin)
    .post(userControllers.userLogin);

router.get("/logout", userControllers.userLogout);

router.route("/signup")
    .get(userControllers.getUserSignup)
    .post(userControllers.userSignup);

router.get("/verify-email", userControllers.verifyEmail);

router.post("/resend-verification-email", jwtMiddleware, userControllers.resendVerificationEmail);

router.get("/user-profile", jwtMiddleware, userControllers.getUserProfile);

router.get("/quiz-history", jwtMiddleware, userControllers.getQuizHistory);

router.get("/quiz-options", jwtMiddleware, userControllers.selectQuizOptions);

router.post("/quiz-questions", jwtMiddleware, userControllers.getQuizQuestions);

router.post("/submit-quiz", jwtMiddleware, userControllers.submitQuiz);

export default router;