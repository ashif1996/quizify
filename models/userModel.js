const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

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
        }
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

userSchema.pre("save", async function(next) {
    if (this.isModified("password")) {
        const salts = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salts);
    }

    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;