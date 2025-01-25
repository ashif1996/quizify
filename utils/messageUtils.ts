import { Request, Response } from "express";

interface FlashMessageOptions {
    req: Request;
    res: Response;
    type?: string;
    message?: string;
    status: number;
    redirectUrl?: string;
    isJson?: boolean;
    success?: boolean;
}

const showFlashMessages = ({
    req,
    res,
    type = "error",
    message = "",
    status,
    redirectUrl = "",
    isJson = false,
    success = false,
}: FlashMessageOptions) => {
    req.flash(type, message);

    if (isJson) {
        res.status(status).json({ success });
    } else {
        res.status(status).redirect(redirectUrl);
    }
};

export default showFlashMessages;