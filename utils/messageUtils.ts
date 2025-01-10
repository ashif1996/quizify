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
}: FlashMessageOptions): Response => {
    req.flash(type, message);

    if (isJson) {
        return res.status(status).json({ success });
    }

    res.status(status).redirect(redirectUrl);
    return res;
};

export default showFlashMessages;