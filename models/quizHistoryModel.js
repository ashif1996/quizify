const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const quizHistorySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    quizId: {
        type: String,
    },
    score: {
        type: Number,
        required: true,
    },
    completedAt: {
        type: Date,
        default: Date.now,
    },
});

const QuizHistory = mongoose.model("QuizHistory", quizHistorySchema);

module.exports = QuizHistory;