import { Request, Response } from "express";

import httpStatusCodes from "../utils/httpStatusCodes.js";

const getHome = (req: Request, res: Response) => {
    const locals = { title: "Home | Quizify" };
    res.status(httpStatusCodes.OK).render("index", {
        locals,
        layout: "layouts/mainLayout",
    });
};

const getContact = (req: Request, res: Response) => {
    const locals = { title: "Contact Us | Quizify" };
    res.status(httpStatusCodes.OK).render("contact", {
        locals,
        layout: "layouts/mainLayout",
    });
};

export default {
    getHome,
    getContact,
};