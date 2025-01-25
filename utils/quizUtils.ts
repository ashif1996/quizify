import crypto from "crypto";

const generateQuizId = (name: string): string => {
    const randomID = crypto.randomUUID();
    return `${name}-${randomID}`;
};

export default generateQuizId;