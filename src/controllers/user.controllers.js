import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import jwt from "jsonwebtoken"

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

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

//   console.log("📩 email:", email);
//   console.log("👤 username:", username);
//   console.log("req.files:", req.files);
// console.log("req.body:", req.body);

  // Validation
  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }

  // File paths (multer fields)
  const avatarLocalPath = req.files?.avatar?.[0]?.path; // for upload.fields
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

// let coverImageLocalPath;
// if(req.files && Array.isArray(req.file.coverImage) && req.files.coverImage.length > 0) {
//   coverImageLocalPath = req.files.coverImage[0].path;
// }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // Upload to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Could not upload avatar, try again");
  }

  // Save user
  const user = await User.create({
    fullName,
    avatar: avatar.secure_url, // ✅ use secure_url
    coverImage: coverImage?.secure_url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  // Fetch created user without password
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong, try again");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async(req,res)=>{
   // req.body->data
   //username or email
   //find the user 
   //pass check
   //access and refresh token
   // send cookie and send res

   const{email,password,username}=req.body

   if(!username && !email){
    throw new ApiError(400,"username or password is required")
   }

  const user = await User.findOne({
    $or:[{username},{email}]
   })
  
   if(!user){
    throw new ApiError(404,"user not exist")
   }

  const isPasswordValid =  await user.isPasswordCorrect
  (password)

 if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials")

   }

const {accessToken,refreshToken} =
await generateAccessAndRefreshTokens(user._id)

const loggeddInUser = await User.findById(user._id).
select("-password -refreshToken")

const options = {
  httpOnly: true,
  secure: true,
};

return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      { user: loggeddInUser, accessToken, refreshToken },
      "User logged in successfully"
    )
  );
})

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

const updateUserAvatar = asyncHandler(async(req,res)=>{
const avatarLocalPath =  req.file?.path

if(!avatarLocalPath){
  throw new ApiError(400,"avatar is missing!")
}

const avatar = await uploadOnCloudinary(avatarLocalPath)
if(!avatar.url){
  throw new ApiError(500,"could not upload avatar, try again")
}

const user = await User.findByIdAndUpdate(req.user._id,{
  $set:{avatar:avatar.url}
},

{new:true,
validateBeforeSave:false,
}).select("-password")
return res.status(200)

.json(new ApiResponse(200,avatar,"avatar updated successfully"))

})

const updateUserCoverImage= asyncHandler(async(req,res)=>{
const coverImageLocalPath =  req.file?.path

if(!coverImageLocalPath){
  throw new ApiError(400,"avatar is missing!")
}

const coverImage = await uploadOnCloudinary(coverImageLocalPath)
if(!coverImage.url){
  throw new ApiError(500,"could not upload coverImage, try again")
}

const user = await User.findByIdAndUpdate(req.user._id,{
  $set:{coverImage:coverImage.url}
},

{new:true,
validateBeforeSave:false,
}).select("-password")
return res.status(200)
.json(new ApiResponse(200,avatar,"coverImage updated successfully"))

})


export { registerUser };
export { loginUser };
export { logoutUser };
export{refreshAccessToken};
export {changeCurrentUserPassword};
export {getCurrentUser};
export {updateAccountDetails};
export {updateUserAvatar};
export {updateUserCoverImage};