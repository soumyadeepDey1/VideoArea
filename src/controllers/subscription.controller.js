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

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const subscribers = await Subscription.find({ channel: channelId }).populate(
    "subscriber",
    "username email fullname avatar"
  );
  if (!subscribers || subscribers.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse("No subscribers found for this channel", [], 404));
  }

  const subscriberList = subscribers.map((sub) => ({
    _id: sub.subscriber._id,
    username: sub.subscriber.username,
    fullname: sub.subscriber.fullname,
    avatar: sub.subscriber.avatar,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse("Subscribers retrieved successfully", subscriberList, 200)
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  // controller to return channel list to which user has subscribed
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }
  const subscriptions = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "username email fullname avatar");

  if (!subscriptions || subscriptions.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse("No subscriptions found for this user", [], 200));
  }

  const subscribedChannels = subscriptions.map((sub) => ({
    _id: sub.channel._id,
    username: sub.channel.username,
    fullname: sub.channel.fullname,
    avatar: sub.channel.avatar,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        "Subscribed channels retrieved successfully",
        subscribedChannels,
        200
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
