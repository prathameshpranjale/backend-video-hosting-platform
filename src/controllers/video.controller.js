import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title || !description){
        throw new ApiError(400, "Title and description are required")
    }

    if (!req.files || !req.files.videoFile || !req.files.thumbnail){
        throw new ApiError(400,"Both video and thumbnail are required.")
    }

    const videoLocalPath = req.files.videoFile?.[0];
    if(!videoLocalPath){
        throw new ApiError(400, "Video local path missing")
    }

    const videocloud = await uploadOnCloudinary(videoLocalPath.path)

    if(!videocloud){
        throw new ApiError(400, "Video was not uploaded on cloudinary")
    }

    const thumbnailLocalPath = req.files.thumbnail?.[0];
    if(!thumbnailLocalPath){
        throw new ApiError(401,"Thumbnail local path missing")
    }

    const thumbnailcloud = await uploadOnCloudinary(thumbnailLocalPath.path)

    if(!thumbnailcloud){
        throw new ApiError(401, "Thumbnail not uploaded correctly on cloudinary")
    }

    const Publishedvideo = await Video.create({
        videoFile: videocloud.url,
        thumbnail: thumbnailcloud.url,
        title,
        description,
        duration: videocloud.duration, // Get duration from Cloudinary response
        owner: req.user._id, // Assuming the owner's ID is stored in req.user
    })
    
    if (!Publishedvideo) {
        throw new ApiError(500, "something went wrong while publishing video")
    }

    return res.status(201).json(
        new ApiResponse(200, Publishedvideo, "Video Published Successfully <& - &>")
    )


})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video ID");
    }

    const video_id = await Video.findById(videoId).populate('owner', 'username').exec();;

    if(!video_id){
        throw new ApiError(400, "Video not found !!!");
    }

    // u can add api response 
    return res.status(200).json(video_id);
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body

    if(!videoId){
        throw new ApiError(404,"video Id not found !!!");
    }
    if (!title && !description) {
        throw new ApiError(400, "At least one field (title, description ) must be provided for update");
    }
    if (!req.file) {
        // console.log(req.file);
        // console.log(req.file.thumbnail);
        throw new ApiError(404, "thumbnail file is missing !!")
    }

    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }


    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    // Handle thumbnail upload if provided
   

    const thumbnailLocalPath = req.file;

    if (!thumbnailLocalPath) {
        console.log(req.file);
        
            throw new ApiError(400, "Thumbnail missing");
    }
    const thumbnailCloud = await uploadOnCloudinary(thumbnailLocalPath.path);

    if (!thumbnailCloud) {
            throw new ApiError(500, "Thumbnail not uploaded correctly on Cloudinary");
    }

   updateData.thumbnail = thumbnailCloud.url; // Include thumbnail URL in update data
    

    // Update video details
    const updatedVideoDetails = await Video.findByIdAndUpdate(videoId, { $set: updateData }, { new: true });

    return res.status(200).json(new ApiResponse(200, updatedVideoDetails, "Video details updated successfully"));


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}