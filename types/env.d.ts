declare namespace NodeJS {
    export interface ProcessEnv {
        NODE_ENV: "development" | "production" | "test";
        PORT?: string;
        SESSION_SECRET: string;
        JWT_SECRET: string;
        MONGO_URI: string;
        SEND_OTP_EMAIL: string;
        SEND_OTP_EMAIL_PASS: string;
    }
}