import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
  const userId = req.user._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Check if the user is already subscribed to the channel
  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });
  if (existingSubscription) {
    // User is already subscribed, so unsubscribe
    await Subscription.deleteOne({
      subscriber: userId,
      channel: channelId,
    });
    return res.status(200).json(new ApiResponse("Unsubscribed successfully"));
  }
  // User is not subscribed, so subscribe
  const newSubscription = new Subscription({
    subscriber: userId,
    channel: channelId,
  });
  await newSubscription.save();
  return res
    .status(200)
    .json(new ApiResponse("Subscribed successfully", newSubscription, 200));
});


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    // controller to return subscriber list of a channel
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    // controller to return channel list to which user has subscribed
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
