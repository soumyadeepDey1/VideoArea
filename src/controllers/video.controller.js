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
  
    const  totalVideos = await Video.countDocuments(searchFilter);
  if (totalVideos === 0) {
    throw new ApiError(404, "No videos found for the given query"); 
  }

  const videos= await
    Video.find(searchFilter)
    .sort(sortOptions)
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

    const totalPages = Math.ceil(totalVideos / pageSize);
    res.status(200).json(
        new ApiResponse({
            success: true,
            message: "Videos fetched successfully",
            data:videos,
            pagination: {
                totalVideos,
                totalPages,
                page: pageNumber,
                page:pageSize,
            },
        })
    )

});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
