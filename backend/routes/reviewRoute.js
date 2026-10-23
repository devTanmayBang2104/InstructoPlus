import express from "express";
import isAuth from "../middleware/isAuth.js";
import { addReview, getAllReviews, getCourseReviews } from "../controller/reviewController.js";
import { validate, addReviewSchema } from "../middleware/validateSchema.js";

const reviewRouter = express.Router();

reviewRouter.post("/givereview", isAuth, validate(addReviewSchema), addReview);
reviewRouter.get("/allReview", getAllReviews);
reviewRouter.get("/courseReview/:courseId", getCourseReviews);

export default reviewRouter;
