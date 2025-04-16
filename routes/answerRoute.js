const express = require("express");
const router = express.Router();

const {
  getAnswersForQuestions,
  postAnswersForQuestions,
  deleteAnswer,
  getAnswerById,
  updateAnswer,
  rateAnswer,
} = require("../controller/answerController");

//GET all answers for a specific question
router.get("/:question_id/answers", getAnswersForQuestions);

//Post Answer for a question
router.post("/questions/:question_id/answers", postAnswersForQuestions);

// Delete answer for a question
router.delete("/:answerId", deleteAnswer);

// GET single answer
router.get("/:answerId", getAnswerById);

// UPDATE answer
router.put("/:answerId", updateAnswer);

// Rate answer
router.post("/:answerId/rate", rateAnswer);

module.exports = router;
