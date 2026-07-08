import express from "express"
import isAuth from "../middleware/isAuth.js"
import { addReview, getAllReviews, getCourseReviews } from "../controller/reviewController.js";




let reviewRouter = express.Router()

reviewRouter.post("/givereview",isAuth,addReview)
reviewRouter.get("/allReview",getAllReviews)
reviewRouter.get("/courseReview/:courseId",getCourseReviews)

export default reviewRouter
