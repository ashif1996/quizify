// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Connect to the database
import connectToDatabase from "./config/dbConfig.js";
connectToDatabase();

import path from "path";
import { fileURLToPath } from "url";
import express, { Request, Response, NextFunction } from "express";
import expressLayouts from "express-ejs-layouts";
import session from "express-session";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import flash from "connect-flash";

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));
app.use(expressLayouts);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");
app.use(flash());

// Flash message middleware
app.use((req: Request, res: Response, next: NextFunction): void => {
    res.locals.successMessage = req.flash("success");
    res.locals.errorMessage = req.flash("error");
    next();
});

interface DecodedToken {
    firstName: string;
    lastName: string;
    isVerified: boolean;
    role: string;
}

// Authentication middleware
app.use((req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies.authToken;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
            res.locals.isLoggedIn = true;
            res.locals.username = `${decoded.firstName} ${decoded.lastName}`.trim();
            res.locals.isVerified = decoded.isVerified;
            res.locals.role = decoded.role;
        } catch (error) {
            console.error("Invalid token:", (error as Error).message);
            res.locals.isLoggedIn = false;
            res.locals.username = null;
            res.locals.isVerified = false;
            res.locals.role = null;
        }
    } else {
        res.locals.isLoggedIn = false;
        res.locals.username = null;
        res.locals.isVerified = false;
        res.locals.role = null;
    }

    next();
});

// Import routes
import indexRoutes from "./routes/indexRoutes.js";
import userRoutes from "./routes/userRoutes.js";

app.use("/", indexRoutes);
app.use("/users", userRoutes);

// 404 handler
app.use((req: Request, res: Response): void => {
    const locals = { title: "404 | Page Not Found" };
    res.status(404).render("404", {
        locals,
        layout: "layouts/errorLayout",
    });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;