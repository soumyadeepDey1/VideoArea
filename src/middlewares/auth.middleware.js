import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError("Unauthorized request", 401);
    }

    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError("Invelid Access token", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(error?.message || "Invelid access Token", 401);
  }
});
