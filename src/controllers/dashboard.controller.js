import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
  const videos = await Video.find({ channel: channelId });
  if (!videos || videos.length === 0) {
    throw new ApiError(404, "No videos found for this channel");
  }

  const totalViews = videos.reduce((acc, video) => acc + video.views, 0);

  const totalVideos = videos.length;
  const totalLikes = await Like.countDocuments({
    video: { $in: videos.map((v) => v._id) },
  });
  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });
  const totalTweets = await Tweet.countDocuments({ channel: channelId });
  const totalComments = await Comment.countDocuments({
    video: { $in: videos.map((v) => v._id) },
  });

  const channelStats = {
    totalViews,
    totalVideos,
    totalLikes,
    totalSubscribers,
    totalTweets,
    totalComments,
  };
  return res
    .status(200)
    .json(new ApiResponse(channelStats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const videos = await Video.find({ channel: channelId })
    .populate("channel", "name profilePicture description")
    .sort({ createdAt: -1 });
  if (!videos || videos.length === 0) {
    throw new ApiError(404, "No videos found for this channel");
  }
  return res
    .status(200)
    .json(new ApiResponse(videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
