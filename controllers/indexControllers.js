const httpStatusCodes = require("../utils/httpStatusCodes");

const getHome = (req, res) => {
    const locals = { title: "Home | Quizify" };
    return res.status(httpStatusCodes.OK).render("index", {
        locals,
        layout: "layouts/mainLayout",
    });
};

const getContact = (req, res) => {
    const locals = { title: "Contact Us | Quizify" };
    return res.status(httpStatusCodes.OK).render("contact", {
        locals,
        layout: "layouts/mainLayout",
    });
};

module.exports = {
    getHome,
    getContact,
}