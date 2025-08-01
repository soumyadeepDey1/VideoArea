import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      (await req.cookies?.accessToken) ||
      (await req.header("Authorization")?.replace("Bearer ", ""));
    if (!token) {
      throw new ApiError("Unauthorized request", 401);
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // Ensure correct secret
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError("Invalid Access token", 401); // Fixed typo
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(error?.message || "Invalid access Token", 401);
  }
});
