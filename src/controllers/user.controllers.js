import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiRespons.js"
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
  console.log("email", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError("All field is required", 400);
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError("User already exists", 409);
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverLocalPath = req.files?.cover[0]?.path;

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
    avater: avatar.url,
    cover: cover?.url || "",
    email,
    password,
    username: username.toLowerCase()
    
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
);

  if (!createdUser) {
    throw new ApiError("Something went wront when resistering the user", 500);
    
  }

  return res.status(201).json(
    new ApiResponse("User created successfully",createdUser, 201)
  )

});
export { registerUser };
