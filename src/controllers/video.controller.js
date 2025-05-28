import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import e from "express";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);
  let searchFilter = {};

  if (query) {
    searchFilter = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    };
  } else {
    throw new ApiError(400, "Query parameter is required");
  }

  if (userId && isValidObjectId(userId)) {
    searchFilter.userId = userId;
  } else {
    throw new ApiError(400, "Invalid userId");
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

  const totalVideos = await Video.countDocuments(searchFilter);
  if (totalVideos === 0) {
    throw new ApiError(404, "No videos found for the given query");
  }

  const videos = await Video.find(searchFilter)
    .sort(sortOptions)
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  const totalPages = Math.ceil(totalVideos / pageSize);
  res.status(200).json(
    new ApiResponse({
      success: true,
      message: "Videos fetched successfully",
      data: videos,
      pagination: {
        totalVideos,
        totalPages,
        page: pageNumber,
        page: pageSize,
      },
    })
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title || !description || !req.files || !req.file.video) {
    throw new ApiError(
      400,
      "Title and description and requested file are required"
    );
  }
  const videoFile = req.files.video;

  if (!videoFile || !videoFile.mimetype.startsWith("video/")) {
    throw new ApiError(400, "Please upload a valid video file");
  }

  try {
    const uploadResonse = await uploadOnCloudinary(videoFile.path, "videos");
    if (!uploadResonse || !uploadResonse.secure_url) {
      throw new ApiError(500, "Failed to upload video to cloudinary");
    }
    const videoUrl = uploadResonse.secure_url;
    const thumbnailUrl = uploadResonse.thumbnail_url || "";

    const newVideo = await Video.create({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      userId: req.user._id, // Assuming req.user is set by the auth middleware
      publishStatus: true,
    });

    if (!newVideo) {
      throw new ApiError(500, "Failed to create video");
    }

    res.status(201).json(
      new ApiResponse({
        success: true,
        message: "Video published successfully",
        data: newVideo,
      })
    );
  } catch (error) {
    throw new ApiError(
      500,
      "An error occurred while publishing the video: " + error
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId)
  
  if (!video) {
    throw new ApiError(404, "Video not found"); 
    
  }

  if (req.user._id.toString() !== video.userId.toString()) {
    throw new ApiError(403, "You are not authorized to view this video");
    
  }
  res.status(200).json(
    new ApiResponse({
      success: true,
      message: "Video fetched successfully",
      data: video,
    })
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }
  const { title, description , thumbnail } = req.body;
  if (title) {
    video.title = title;
    
  }
  if (description) {
    video.description = description;
    
  }
  if (thumbnail) {
    video.thumbnailUrl = thumbnail;
    
  }
  const updatedVideo = await video.save();
  res.status(200).json(
    new ApiResponse({
      success: true,
      message: "Video updated successfully",
      data: updatedVideo,
    })
  );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }
  try {
    await uploadOnCloudinary.deleteResource(video.cloudinaryPublicId);
    await video.remove();
    res.status(200).json(
      new ApiResponse({
        success: true,
        message: "Video deleted successfully",
      })
    );
  } catch (error) {
    throw new ApiError(500, "An error occurred while deleting the video: " + error);
  }

});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle publish status of a video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to toggle publish status of this video");
  }
  video.publishStatus = !video.publishStatus;
  await video.save();
  res.status(200).json(
    new ApiResponse({
      success: true,
      message: `Video ${video.publishStatus ? "published" : "unpublished"} successfully`,
      data: video,
    })
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
