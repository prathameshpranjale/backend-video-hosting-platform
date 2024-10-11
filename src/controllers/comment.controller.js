import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    const comments = await Comment.find({ video: videoId })
        .populate('owner', 'username') // Assuming you want to return the username of the comment owner
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

    const totalComments = await Comment.countDocuments({ video: videoId });

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            totalComments,
            currentPage: page,
            totalPages: Math.ceil(totalComments / limit),
        }, "Comments retrieved successfully")
    );

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;
    const userId = req.user.id

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    if(!videoId){
        throw new ApiError(404, "VideoID not found");
    }
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }
    // comment cannot be empty 
    if (!content || content.trim() === '') {
        throw new ApiError(400, "Comment content cannot be empty");
    }


    const newComment = await Comment.create({
        content,
        owner:userId,
        video:videoId,
    });

    return res.status(201).json(
        new ApiResponse(201, {
        comment: newComment,
    }, "Comment added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;


    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== userId) {
        throw new ApiError(403, "Not authorized to update this comment");
    }

    if (!content || content.trim() === '') {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    comment.content = content;
    await comment.save();

    return res.status(200).json(
        new ApiResponse(200, {
            comment,
        }, "Comment updated successfully")
    );
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;  // Extract commentId from the route
    const userId = req.user.id;        // Get the ID of the authenticated user


    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the user is the owner of the comment
    if (comment.owner.toString() !== userId) {
        throw new ApiError(403, "Not authorized to delete this comment");
    }

 
    await Comment.findByIdAndDelete(commentId);


    return res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    );
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}