import express from "express";
const router = express.Router();

import indexControllers from "../controllers/indexControllers.js";

router.get("/", indexControllers.getHome);
router.get("/contact", indexControllers.getContact);

export default router;