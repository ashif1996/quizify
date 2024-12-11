require("dotenv").config();

const connectToDatabase = require("./config/dbConfig");
connectToDatabase();

const path = require("path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const cookieParser = require('cookie-parser');
const jwt = require("jsonwebtoken");
const flash = require("connect-flash");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(expressLayouts);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(flash());

app.use((req, res, next) => {
    res.locals.successMessage = req.flash("success");
    res.locals.errorMessage = req.flash("error");
    next();
});

app.use((req, res, next) => {
    const token = req.cookies.authToken;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
            res.locals.isLoggedIn = true;
            res.locals.username = `${decoded.firstName} ${decoded.lastName}`.trim();
        } catch (error) {
            console.error("Invalid token:", error.message);
            res.locals.isLoggedIn = false;
            res.locals.username = null;
        }
    } else {
        res.locals.isLoggedIn = false;
        res.locals.username = null;
    }

    next();
});

const indexRoutes = require("./routes/indexRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/", indexRoutes);
app.use("/users", userRoutes);

app.use((req, res, next) => {
    const locals = { title: "404 | Page Not Found" };
    return res.status(404).render("404", {
        locals,
        layout: "layouts/errorLayout",
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});