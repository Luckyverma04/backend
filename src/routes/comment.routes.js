import { Router } from "express";
import mongoose from "mongoose";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import{getVideoComments,addComment,updateComment}
 from "../controllers/comment.controllers.js"

const router = Router()

router.route("/videoComments/:videoId").get(getVideoComments);

router.route("/addComments/:videoId").post(verifyJWT, addComment);

router.route("/updateComments/:commentId").patch(verifyJWT, updateComment);
export default router;