import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


const getVideoComments = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;

        // Validate videoId
        if (!videoId?.trim()) {
            throw new ApiError(400, "Video ID is required");
        }

        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(400, "Invalid video ID format");
        }

        // Convert to ObjectId
        const videoObjectId = new mongoose.Types.ObjectId(videoId);

        // Check if video exists
        const videoExists = await Video.findById(videoObjectId);
        if (!videoExists) {
            throw new ApiError(404, "Video not found");
        }

        // Build sort object
        const sortOptions = {};
        const validSortFields = ["createdAt", "updatedAt", "likes"];
        if (validSortFields.includes(sortBy)) {
            sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
        } else {
            sortOptions["createdAt"] = -1; // default sort
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const numericLimit = parseInt(limit);

        // Get comments with pagination
        const comments = await Comment.aggregate([
            {
                $match: { video: videoObjectId }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1,
                                fullName: 1,
                                email: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$owner",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: sortOptions
            },
            {
                $skip: skip
            },
            {
                $limit: numericLimit
            },
            {
                $project: {
                    content: 1,
                    owner: 1,
                    likes: 1,
                    video: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        // Get total count for pagination info
        const totalComments = await Comment.countDocuments({ video: videoObjectId });

        // Calculate total pages
        const totalPages = Math.ceil(totalComments / numericLimit);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        comments,
                        pagination: {
                            currentPage: parseInt(page),
                            totalPages,
                            totalComments,
                            hasNextPage: parseInt(page) < totalPages,
                            hasPrevPage: parseInt(page) > 1,
                            limit: numericLimit
                        }
                    },
                    "Comments fetched successfully"
                )
            );

    } catch (error) {
        console.error("Error fetching comments:", error);
        
        // If it's already an ApiError, rethrow it
        if (error instanceof ApiError) {
            throw error;
        }
        
        // Handle specific MongoDB errors
        if (error.name === 'CastError') {
            throw new ApiError(400, "Invalid ID format");
        }
        
        if (error.name === 'MongoNetworkError') {
            throw new ApiError(500, "Database connection error");
        }
        
        // Generic server error
        throw new ApiError(500, error.message || "Server error while fetching comments");
    }
});

const addComment = asyncHandler(async (req, res) => {
    try {
        // console.log("=== REQUEST DEBUG INFO ===");
        // console.log("Method:", req.method);
        // console.log("URL:", req.url);
        // console.log("Headers:", req.headers);
        // console.log("Raw body:", req.body);
        // console.log("Content-Type:", req.headers['content-type']);
        // console.log("==========================");

        // Check if req.body exists (more flexible approach)
        let content;
        
        if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
            // If body exists, try to get content
            content = req.body.content;
        } else if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            // Handle form data
            content = req.body.content;
        } else {
            // Try to parse raw body if it's a string
            if (typeof req.body === 'string') {
                try {
                    const parsedBody = JSON.parse(req.body);
                    content = parsedBody.content;
                } catch (parseError) {
                    console.log("Failed to parse body as JSON:", parseError);
                }
            }
        }

        const { videoId } = req.params;
        const userId = req.user?._id;

        // Validate input
        if (!videoId?.trim() || !mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(400, "Valid video ID is required");
        }

        if (!content?.trim()) {
            throw new ApiError(400, "Comment content is required");
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(401, "User authentication required");
        }

        // Check if video exists
        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Create the comment
        const comment = await Comment.create({
            content: content.trim(),
            owner: userId,
            video: videoId,
            likes: []
        });

        // Populate the owner details
        const populatedComment = await Comment.findById(comment._id)
            .populate('owner', 'username avatar fullName email')
            .lean();

        // Update video's comment count
        await Video.findByIdAndUpdate(videoId, {
            $inc: { commentCount: 1 }
        });

        return res.status(201).json(
            new ApiResponse(201, populatedComment, "Comment added successfully")
        );

    } catch (error) {
        console.error("Error adding comment:", error);
        
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error.message || "Server error while adding comment");
    }
});


export { getVideoComments,addComment };