import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { jwt } from "jsonwebtoken";


export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header ("Authorization")?.replace("Bearer","")
        // now we have access of token either from cookies or auth header
    
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodecToken = jwt.verifyJWT(token, process.env.ACCESS_TOKEN_SECRET)
        const user = User.findById(decodecToken?._id).select("-password -refreshToken")
    
        if(!user){
            // discussion about todo 
    
            throw new ApiError(401,"Invalid access token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid acess token !!!!!!!!")
    }
    
})