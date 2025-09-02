import jwt from "jsonwebtoken"
import asyncHandler from "express-async-handler"
import ApiError from "../utils/ApiError.js"
import User from "../models/user.model.js"
export const verifyJWT = asyncHandler(async(req,_,next)=>{
   
    try {
        const token =req.cookies?.accessToken || 
        req.header("Authorization")?.
        replace("Bearer ","")
    
        if(!token){
            throw new ApiError(401,"not authorized")
        }
        
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(401,"not authorized user not found")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401,"not authorized invalid token")
    }

})