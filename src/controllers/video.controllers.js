import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import mongoosePaginate from "mongoose-paginate-v2";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const getAllVideos = asyncHandler(async(req,res)=>{
    let {page,limit,search} = req.query
    page = parseInt(page) || 1
    limit = parseInt(limit) || 10
    const skip = (page-1)*limit
    const match = {isPublished:true}
    if(search){
        match.title = {$regex:search,$options:"i"}
    }
    const aggregate = Video.aggregate()
    .match(match)
    .lookup({
        from:"users",
        localField:"owner",
        foreignField:"_id",
        as:"owner"
    })
    .unwind("$owner")
    .project({
        "owner.password":0,
        "owner.email":0,
        "owner.subscribers":0,
        "owner.videos":0,
        "owner.createdAt":0,
        "owner.updatedAt":0,
        "owner.__v":0
    })
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit)
    const options = {page,limit}
    const videos = await Video.aggregatePaginate(aggregate,options)
    res.status(200).json(new ApiResponse("Videos fetched successfully",videos))
})

const getVideoById = asyncHandler(async(req,res)=>{
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError("Invalid video id",400)
    }   
    const video = await Video.findById(id).populate
    ("owner","-password -email -subscribers -videos -createdAt -updatedAt -__v")
    if(!video || (video.isPublished === false && (!req.user || (req.user && req.user._id.toString() !== video.owner._id.toString())))){
        throw new ApiError("Video not found",404)
    }
    res.status(200).json(new ApiResponse("Video fetched successfully",video))
})

const publishVideo = asyncHandler(async(req,res)=>{
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError("Invalid video id",400)
    }
    const video = await Video.findById(id)
    if(!video){
        throw new ApiError("Video not found",404)
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError("You are not authorized to publish this video",403)
    }
    // if(video.isPublished){
    //     throw new ApiError("Video is already published",400)
    // }
    video.isPublished = true
    await video.save()
    res.status(200).json(new ApiResponse("Video published successfully",video))
})

const unpublishVideo = asyncHandler(async(req,res)=>{
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError("Invalid video id",400)
    }
    const video = await Video.findById(id)
    if(!video){
        throw new ApiError("Video not found",404)
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError("You are not authorized to unpublish this video",403)
    }
    if(!video.isPublished){
        throw new ApiError("Video is already unpublished",400)
    }
    video.isPublished = false
    await video.save()
    res.status(200).json(new ApiResponse("Video unpublished successfully",video))
})

const updateVideo = asyncHandler(async(req,res)=>{
    const {id} = req.params
    const {title,description} = req.body
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError("Invalid video id",400)
    }
    const video = await Video.findById(id)
    if(!video){
        throw new ApiError("Video not found",404)
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError("You are not authorized to update this video",403)
    }
    if(title) video.title = title
    if(description) video.description = description
    await video.save()
    res.status(200).json(new ApiResponse("Video updated successfully",video))
})
const deleteVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log("DELETE request received for video", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError("Invalid video id", 400);
    }

    // Find and delete in one step
    const deletedVideo = await Video.findByIdAndDelete(id);

    if (!deletedVideo) {
        throw new ApiError("Video not found", 404);
    }

    // Authorization check after fetching the document
    if (deletedVideo.owner.toString() !== req.user._id.toString()) {
        throw new ApiError("You are not authorized to delete this video", 403);
    }

    console.log("Video deleted successfully:", deletedVideo._id);
    res.status(200).json(new ApiResponse("Video deleted successfully", deletedVideo));
});



const createVideo = asyncHandler(async (req,res) => {
    const { title, description } = req.body;

    if(!title || !description){
        throw new ApiError("Title, description are required", 400);
    }

    if(!req.file){
        throw new ApiError("Video file is required", 400);
    }
console.log("req.file:", req.file);
    const videoResult = await uploadOnCloudinary(req.file.path,"video");
console.log("videoResult.url,:", videoResult.url,);

    const video = await Video.create({
        title,
        description: description,
        videoFile: videoResult.url,
        owner: req.user._id
    });

    res.status(201).json(new ApiResponse("Video created successfully", video));
});

export {
    getAllVideos,
    getVideoById,
    publishVideo,
    unpublishVideo,
    updateVideo,
    deleteVideo,
    createVideo
}
