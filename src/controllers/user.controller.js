import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiRespons.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import e from "express";

const genarateAccessAndRefreshToken = async (userId) => {
  //generate access token and refresh token
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefressToken();
    //save refresh token in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      "Something went wrong while genarating refresh and access token",
      500
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //res.status(200).json({ message: 'chai aur code with Soumyadeep' });
  //get user details from frontend
  //valiate the data- not empty, valid email, password length, etc
  //check if user already exists in the database:username,email
  //check for image , check for avatar
  //upload image to cloudinary, avatar
  //create user object- create entry in db
  //remove password and refresh token field
  // check for user creation
  //return res

  const { fullName, email, username, password } = req.body;
  //console.log("email", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError("All field is required", 400);
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError("User already exists", 409);
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverLocalPath =  req.files?.cover[0]?.path;
  let coverLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.cover) &&
    req.files.cover.length > 0
  ) {
    coverLocalPath = req.files.cover[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError("Avatar is required", 400);
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const cover = await uploadOnCloudinary(coverLocalPath);
  if (!avatar) {
    throw new ApiError("Avatar is required", 400);
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    cover: cover?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError("Something went wront when resistering the user", 500);
  }

  return res
    .status(201)
    .json(new ApiResponse("User created successfully", createdUser, 201));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body: username, email, password
  //username or email
  //find the user in the db
  //check for password
  //generate access token and refresh token
  //send cookies to the browser

  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError("Username or email is required", 400);
  }
  if (!password) {
    throw new ApiError("Password is required", 400);
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError("User does not exist", 404);
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError("Invalid password", 401);
  }

  const { accessToken, refreshToken } = await genarateAccessAndRefreshToken(
    user._id
  );

  //set cookie in the browser
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        "User logged in successfully",
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        200
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", null, option)
    .clearCookie("refreshToken", null, option)
    .json(new ApiResponse("User logged out successfully", {}, 200));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomeingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomeingRefreshToken) {
    throw new ApiError("unauthorized request", 401);
  }
  try {
    const decodedToken = jwt.verify(
      incomeingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError("Invelid refresh token", 401);
    }
    if (incomeingRefreshToken !== user.refreshToken) {
      throw new ApiError("Refresh token is expired or used", 401);
    }
    const { newAccessToken, newRefreshToken } =
      await genarateAccessAndRefreshToken(user._id);
    const option = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new ApiResponse(
          "AccessToken refreshed in successfully",
          {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
          200
        )
      );
  } catch (error) {
    throw new ApiError(error?.message || "Invalid refresh token", 401);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError("All field is required", 400);
  }

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError("Old password is incorrect", 400);
  }
  if (oldPassword === newPassword) {
    throw new ApiError(
      "New password should be different from old password",
      400
    );
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse("Password changed successfully", {}, 200));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse("User fetched successfully", req.user, 200));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError("All field is required", 400);
  }

  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse("User details updated successfully", {}, 200));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError("Avatar is missing", 400);
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError("Error while uploading on avatar", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse("User avatar updated successfully", user, 200));
});

const updateUserCover = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;
  if (!coverLocalPath) {
    throw new ApiError("cover is missing", 400);
  }
  const cover = await uploadOnCloudinary(coverLocalPath);
  if (!cover.url) {
    throw new ApiError("Error while uploading on cover", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        cover: cover.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse("User cover updated successfully", user, 200));
});

const getUserChanelProfile= asyncHandler(async(req,res) =>{
  const {username}=req.params
  if(!username?.trim()){
    throw new ApiError("Username is missing",400)
  }

  const chanel = await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"Subscription",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"Subscription",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscriptions"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        chanelSubscriptionsCount:{
          $size:"$subscriptions"

        },
        isSubscribed:{
          $cond:{
            if:{
              $in:[req.user?._id,"$subscribers.subscriber"]
            },
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        username:1,
        avatar:1,
        cover:1,
        subscribersCount:1,
        chanelSubscriptionsCount:1, 
        isSubscribed:1,
        email:1,
      }
    }
  ])

  if (!chanel?.length) {
    throw new ApiError("Chanel not found", 404);
  }
  return res
    .status(200)
    .json(new ApiResponse("Chanel profile fetched successfully", chanel[0], 200));
})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])
         console.log(user[0].watchHistory);

  return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully",));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCover,
  getUserChanelProfile,
  getWatchHistory,
};
