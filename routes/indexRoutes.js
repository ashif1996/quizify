const express = require("express");
const router = express.Router();

const indexControllers = require("../controllers/indexControllers");

router.get("/", indexControllers.getHome);
router.get("/contact", indexControllers.getContact);

module.exports = router;