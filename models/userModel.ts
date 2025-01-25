import mongoose, { Document, Model, Schema, ObjectId } from "mongoose";
import bcrypt from "bcrypt";

export interface UserDocument extends Document {
    _id: ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    isVerified: boolean;
    verificationToken?: string;
    verificationTokenExpires?: Date;
    quizHistory: mongoose.Types.ObjectId[];
    totalPoints: number;
    createdAt: Date;
}

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: (val) => {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
            },
            message: "Invalid email format",
        },
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
    },
    role: {
        type: String,
        required: true,
        default: "User",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
    },
    verificationTokenExpires: {
        type: Date,
    },
    quizHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "QuizHistory",
        },
    ],
    totalPoints: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.index({ email: 1 }, { unique: true });

userSchema.pre("save", async function(next) {
    if (this.isModified("password")) {
        const salts = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salts);
    }

    next();
});

const User: Model<UserDocument> = mongoose.model<UserDocument>("User", userSchema);

export default User;