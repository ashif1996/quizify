const jwt = require("jsonwebtoken");

const showFlashMessages = require("../utils/messageUtils");

const isTokenPresent = (req, redirectUrl) => {
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

const fetchUserId = (req) => {
    let userId;

    const token = req.cookies.authToken || req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
        try {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            userId = decodedToken.userId;
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                console.warn("Token is expired, proceeding as an unauthenticated user.");
            } else {
                console.error("Error verifying token:", error);
            }
        }
    }

    return userId;
};

module.exports = {
    isTokenPresent,
    fetchUserId,
};