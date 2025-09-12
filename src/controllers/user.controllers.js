import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import { subscribe } from "diagnostics_channel";
import mongoose from "mongoose";
 import nodemailer from "nodemailer";
import  sendEmail from "../utils/sendEmail.js"
const generateAccessAndRefreshTokens = async(userId)=>{
  try {
   const user = await User.findById(userId)
  const accessToken =  user.generateAccessToken()
  const refreshToken = user.generateRefreshTokens() 

  user.refreshToken = refreshToken
  await user.save({validateBeforeSave: false})

  return {accessToken,refreshToken}

    
  } catch (error) {
    throw new ApiError(500,"Something went wrong while generating acces and refresh token")
  }
}

// const registerUser = asyncHandler(async (req, res) => {
//   const { fullName, email, username, password } = req.body;

//   // Validation
//   if ([fullName, email, username, password].some((field) => !field?.trim())) {
//     throw new ApiError(400, "All fields are required");
//   }

//   // Check if user already exists
//   const existedUser = await User.findOne({
//     $or: [{ email }, { username }],
//   });

//   if (existedUser) {
//     throw new ApiError(409, "User already exists with this email or username");
//   }

//   // File paths (multer fields)
//   const avatarLocalPath = req.files?.avatar?.[0]?.path;
  
//   // Handle cover image - check if it exists first
//   let coverImageLocalPath;
//   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
//     coverImageLocalPath = req.files.coverImage[0].path;
//   }

//   if (!avatarLocalPath) {
//     throw new ApiError(400, "Avatar is required");
//   }

//   // Upload to cloudinary
//   const avatar = await uploadOnCloudinary(avatarLocalPath);
//   let coverImage;
//   if (coverImageLocalPath) {
//     coverImage = await uploadOnCloudinary(coverImageLocalPath);
//   }

//   if (!avatar || !avatar.url) {
//     throw new ApiError(400, "Could not upload avatar, try again");
//   }

//   // Prepare user data
//   const userData = {
//     fullName,
//     email,
//     username: username.toLowerCase(),
//     password,
//     avatar: {
//       public_id: avatar.public_id,
//       url: avatar.secure_url || avatar.url, // Use secure_url if available, fallback to url
//     }
//   };

//   // Add cover image only if it exists
//   if (coverImage) {
//     userData.coverImage = {
//       public_id: coverImage.public_id,
//       url: coverImage.secure_url || coverImage.url,
//     };
//   }

//   // Save user
//   const user = await User.create(userData);

//   // Fetch created user without password
//   const createdUser = await User.findById(user._id).select(
//     "-password -refreshToken"
//   );

//   if (!createdUser) {
//     throw new ApiError(500, "Something went wrong, try again");
//   }

//   return res
//     .status(201)
//     .json(new ApiResponse(201, createdUser, "User registered successfully"));
// });


const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  // Validation
  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user exists
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }

  // File uploads (✅ avatar is now optional)
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  let coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  let avatar, coverImage;

  if (avatarLocalPath) {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar || !avatar.url) {
      throw new ApiError(400, "Could not upload avatar, try again");
    }
  }

  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  // Save user
  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar
      ? {
          public_id: avatar.public_id,
          url: avatar.secure_url || avatar.url,
        }
      : {
          public_id: null,
          url: "https://cdn-icons-png.flaticon.com/512/149/149071.png", // ✅ Default avatar URL
        },
    coverImage: coverImage
      ? {
          public_id: coverImage.public_id,
          url: coverImage.secure_url || coverImage.url,
        }
      : undefined,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong, try again");
  }

  // ✅ Send Welcome Email
  await sendEmail({
    to: email,
    subject: "Welcome to MyApp 🎉",
    html: `
      <h2>Hello ${fullName},</h2>
      <p>Thank you for registering at <b>MyApp</b>!</p>
      <p>Your account has been created successfully.</p>
      <br/>
      <p>Regards,<br/>MyApp Team</p>
    `,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully & email sent"));
});


const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Find user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user not exist");
  }

  // Validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // ⬅️ Save refreshToken into DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Exclude sensitive fields
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true, // change to false if testing without https
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});


const logoutUser = asyncHandler(async(req,res)=>{

await User.findByIdAndUpdate(req.user._id,{
  $set:{refreshToken:undefined}
  },
{
  new:true
})

const options ={
  httpOnly :true,
  secure:true,

}
return res.status(200).clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,null,"logged out successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
if(!incomingRefreshToken){
  throw new ApiError(401,"unAuthorized request")

}
try {
  const decodedToken = jwt.verify(
    incomingRefreshToken,process.env.
    REFRESH_TOKEN_SECRET)
  
  const user = await User.findById(decodedToken?._id)
  
  if(!user){
    throw new ApiError(401,"invalid refresh token")
  
  }
  if(incomingRefreshToken !== user.refreshToken){
    throw new ApiError(401,"expire or used")
  
  }
  
  const options ={
    httpOnly :true,
    secure:true,
  }
  const {accessToken,newRefreshToken} = 
  await generateAccessAndRefreshTokens
  (user._id)
  
  return res.
  status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",newRefreshToken,options)
  .json(new ApiResponse(
    200,
    {accessToken,newRefreshToken},
    "Access token refreshed successfully"))
} catch (error) {
  throw new ApiError(401,"invalid or expired refresh token")

}

})

const changeCurrentUserPassword = asyncHandler(async(req,res)=>{
  const{oldPassword,newPassword,confPassword}= req.body

const user = await User.findById(req.user._id)
const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

if(!isPasswordCorrect){
  throw new ApiError(400,"old password is incorrect")
}

if(newPassword !== confPassword){
  throw new ApiError(400,"new password and confirm password do not match")
}

user.password = newPassword
await user.save({validateBeforeSave:false})

return res
.status(200)
.json(new ApiResponse(200,null,"password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res.status(200)
  .json(new ApiResponse(200,req.user,"user details fetched successfully"))

})

const updateAccountDetails = asyncHandler(async(req,res)=>{

  const {fullName,email} = req.body


  if(!fullName || !email){
    throw new ApiError(400,"fullName and email are required")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
$set:{fullName, email}
    },
    {new:true}
    ).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,user,"user details updated successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is missing!");
  }

  // Get user first (to access old avatar)
  const existingUser = await User.findById(req.user._id);
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  // Upload new avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiError(500, "Could not upload avatar, try again");
  }

  // If old avatar exists, delete it from Cloudinary
  if (existingUser.avatar?.public_id) {
    await cloudinary.uploader.destroy(existingUser.avatar.public_id);
  }

  // Save new avatar in DB (both url + public_id)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: {
          url: avatar.url,
          public_id: avatar.public_id,
        },
      },
    },
    { new: true, validateBeforeSave: false }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is missing!");
  }

  // 1️⃣ Get existing user
  const existingUser = await User.findById(req.user._id);
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  // 2️⃣ Upload new cover image
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage?.url) {
    throw new ApiError(500, "Could not upload cover image, try again");
  }

  // 3️⃣ Delete old cover image from Cloudinary (if exists)
  if (existingUser.coverImage?.public_id) {
    await cloudinary.uploader.destroy(existingUser.coverImage.public_id);
  }

  // 4️⃣ Update DB with new image { url, public_id }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: {
          url: coverImage.url,
          public_id: coverImage.public_id,
        },
      },
    },
    { new: true, validateBeforeSave: false }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: { username: username.toLowerCase() }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedToChannels",
      }
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        subscribedToChannelsCount: { $size: "$subscribedToChannels" },
        isSubscribed: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(req.user?._id),
                "$subscribers.subscriber"
              ]
            },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscribedToChannelsCount: 1,
        isSubscribed: 1,
        createdAt: 1
      }
    }
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel profile fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
 const user = await User.aggregate([
  {
    $match:{
      _id: new mongoose.Types.ObjectId(req.user._id)
    }
  },{
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
                avatar:1,

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
},

])
  if (!user.length) {
    throw new ApiError(404, "User not found");
  }

  return res
  .status(200)
  .json(new ApiResponse(200,user[0].watchHistory, "Watch history fetched successfully"));
  })

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};