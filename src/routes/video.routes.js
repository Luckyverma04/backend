import { Router } from "express";
import mongoose from "mongoose"; 
import {
  getAllVideos,
    getVideoById,
    publishVideo,
    unpublishVideo,
    updateVideo,
    deleteVideo,
    createVideo
 
}
from "../controllers/video.contollers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router()
router.route("/getAllVideos").get(getAllVideos)

router.post(
  "/createVideo",
  verifyJWT,
  upload.single("video"),   
  createVideo
);


router.route("/publish/:id").post(verifyJWT,publishVideo)

router.route("/unpublish/:id").post(verifyJWT,unpublishVideo)

router.route("/updateVideo/:id").patch(verifyJWT,upload.fields([
    {name:"video",maxCount:1},
    {name:"thumbnail",maxCount:1}
]),updateVideo)

router.route("/deleteVideo/:id").delete(verifyJWT,deleteVideo)

router.route("/getVideoById/:id").get(verifyJWT,getVideoById)
export default router
