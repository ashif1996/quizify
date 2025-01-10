import mongoose from "mongoose";
const { Schema } = mongoose;

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

export default QuizHistory;