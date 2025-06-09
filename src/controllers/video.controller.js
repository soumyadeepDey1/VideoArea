import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteResource } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);

  if (isNaN(pageNumber) || pageNumber < 1) {
    throw new ApiError(400, "Invalid page number");
  }
  if (isNaN(pageSize) || pageSize < 1) {
    throw new ApiError(400, "Invalid limit value");
  }

  let searchFilter = {};

  if (query && query.trim() !== "") {
    searchFilter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }
    searchFilter.userId = userId;
  }

  const allowedSortFields = ["createdAt", "title", "publishStatus"];
  const allowedSortTypes = ["asc", "desc"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder =
    allowedSortTypes.includes(sortType) && sortType === "asc" ? 1 : -1;
  const sortOptions = { [sortField]: sortOrder };

  const totalVideos = await Video.countDocuments(searchFilter);

  const videos = await Video.find(searchFilter)
    .sort(sortOptions)
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  const totalPages = Math.ceil(totalVideos / pageSize);

  return res.status(200).json(
    new ApiResponse({
      success: true,
      message: "Videos fetched successfully",
      data: videos,
      pagination: {
        totalVideos,
        totalPages,
        page: pageNumber,
        pageSize: pageSize,
      },
    })
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "Title, description, and video file are required");
  }
  const videoFilePath = req.files?.videoFile?.[0]?.path;
  if (!videoFilePath) {
    throw new ApiError(400, "Video file is required");
  }
  const videoResponse = await uploadOnCloudinary(videoFilePath);
  if (!videoResponse || !videoResponse.secure_url) {
    throw new ApiError(500, "Failed to upload video to Cloudinary");
  }
  const videoUrl = videoResponse.secure_url;

  // Upload thumbnail if provided
  let thumbnailUrl = "";
  if (req.files.thumbnail) {
    const thumbnailFile = Array.isArray(req.files.thumbnail)
      ? req.files.thumbnail[0]
      : req.files.thumbnail;
    if (!thumbnailFile.mimetype.startsWith("image/")) {
      throw new ApiError(400, "Uploaded thumbnail is not an image");
    }
    const thumbResponse = await uploadOnCloudinary(
      thumbnailFile.path,
      "thumbnails"
    );
    if (!thumbResponse || !thumbResponse.secure_url) {
      throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
    }
    thumbnailUrl = thumbResponse.secure_url;
  } else {
    thumbnailUrl = videoResponse.thumbnail_url || "";
  }

  try {
    const newVideo = await Video.create({
      title,
      description,
      videoFile: videoUrl,
      thumbnail: thumbnailUrl,
      owner: req.user._id,
      publishStatus: true,
      cloudinaryPublicId: videoResponse.public_id,
    });

    if (!newVideo) {
      throw new ApiError(500, "Failed to create video");
    }

    return res.status(201).json(
      new ApiResponse({
        success: true,
        message: "Video published successfully",
        data: newVideo,
      })
    );
  } catch (error) {
    throw new ApiError(
      500,
      "An error occurred while publishing the video: " + error.message
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (req.user._id.toString() !== video.owner.toString()) {
    throw new ApiError(403, "You are not authorized to view this video");
  }
  return res.status(200).json(
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
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }
  const { title, description, thumbnail } = req.body;
  if (title) {
    video.title = title;
  }
  if (description) {
    video.description = description;
  }
  if (thumbnail) {
    video.thumbnail = thumbnail;
  }

  if (req.files && req.files.thumbnail) {
    const thumbnailFile = Array.isArray(req.files.thumbnail)
      ? req.files.thumbnail[0]
      : req.files.thumbnail;
    if (!thumbnailFile.mimetype.startsWith("image/")) {
      throw new ApiError(400, "Uploaded thumbnail is not an image");
    }
    const thumbResponse = await uploadOnCloudinary(
      thumbnailFile.path,
      "thumbnails"
    );
    if (!thumbResponse || !thumbResponse.secure_url) {
      throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
    }
    const thumbnailUrl = thumbResponse.secure_url;
    video.thumbnail = thumbnailUrl;
  }

  const updatedVideo = await video.save();
  return res.status(200).json(
    new ApiResponse({
      success: true,
      message: "Video updated successfully",
      data: updatedVideo,
    })
  );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  try {
    const publicId = video.cloudinaryPublicId;
    console.log("Deleting video from Cloudinary:", video.cloudinaryPublicId);
    await deleteResource(publicId, "video");

    await video.deleteOne();

    return res.status(200).json(
      new ApiResponse(
        {
          success: true,
          message: "Video deleted successfully",
        },
        200
      )
    );
  } catch (error) {
    throw new ApiError(
      500,
      "An error occurred while deleting the video: " + error.message
    );
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to toggle publish status of this video"
    );
  }
  video.isPublished = !video.isPublished;
  if (video.isPublished) {
    video.views = 0; // Reset views when publishing
  }
  console.log(
    `Toggling publish status for video ${videoId} to ${video.isPublished}`
  );
  await video.save();
  return res.status(200).json(
    new ApiResponse({
      success: true,
      message: `Video ${video.isPublished ? "published" : "unpublished"} successfully`,
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
