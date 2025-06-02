import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const existingLike = await Like.findOne({
    video: videoId,
    likeby: req.user._id,
  });
  if (existingLike) {
    // Unlike the video
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, "Video unliked successfully", existingLike));
  } else {
    // Like the video
    const newLike = new Like({
      video: videoId,
      likeby: req.user._id,
    });
    await newLike.save();
    return res
      .status(201)
      .json(new ApiResponse(201, "Video liked successfully", newLike));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  const existingLike = await Like.findOne({
    comment: commentId,
    likeby: req.user._id,
  });
  if (existingLike) {
    // Unlike the comment
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, "Comment unliked successfully", existingLike));
  } else {
    // Like the comment
    const newLike = new Like({
      comment: commentId,
      likeby: req.user._id,
    });
    await newLike.save();
    return res
      .status(201)
      .json(new ApiResponse(201, "Comment liked successfully", newLike));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  const existingLike = await Like.findOne({
    tweet: tweetId,
    likeby: req.user._id,
  });
  if (existingLike) {
    // Unlike the tweet
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, "Tweet unliked successfully", existingLike));
  } else {
    // Like the tweet
    const newLike = new Like({
      tweet: tweetId,
      likeby: req.user._id,
    });
    await newLike.save();
    return res
      .status(201)
      .json(new ApiResponse(201, "Tweet liked successfully", newLike));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userid = req.user._id;
  const likedVideos = await Like.find({
    likeby: userid,
    video: { $exists: true },
  })
    .populate("video", "title description videoUrl thumbnail")
    .populate("likeby", "username profilePicture")
    .sort({ createdAt: -1 });
  if (!likedVideos || likedVideos.length === 0) {
    return res.status(404).json(new ApiResponse(404, "No liked videos found"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Liked videos retrieved successfully", likedVideos)
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
