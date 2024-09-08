import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';
// this user can interact with mongodb directly 
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";

// this is method 
const generateAccessTokenAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        // acess and refresh token methods from user model
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        // adding refresh token to database
        user.refreshToken = refreshToken
        // saving the and adding this line of validate before save
        // cause we dont want to kickin the password check functionality 
        // so it is must add await as its gonna take some time
        await user.save({validateBeforeSave:false})
        // also there is no need to hold such methods in any variable 

        // after saving return both tokens
        return {accessToken,refreshToken}


    }catch(error){
        throw new ApiError(500,"something went wrong while genereating refresh and acess token!!!!!!!!!! ")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // console.log('Request received in controller:', req.body);  // Log the request body in the controller
    // res.status(200).json({
    //     message: "ok doneee"
    // });

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
    
    // form se data aa raha hai 
    const{fullName,email,username,password} = req.body
    // console.log("email",email)




    // email validation code using regex
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };


    // steps to check for registration
   if(
    [fullName,email,username,password].some((field)=>field.trim()==="") || 
    !isValidEmail(email)
   ){
       throw new ApiError(400, "All fields are required and email must be valid");
   }

   const existedUser = await User.findOne({
    
    // operators which can be used to to ccheck multiple 
    // checks for username and email
    $or:[{username},{email}]
   })

   if(existedUser){
    throw new ApiError(409,"User with username or email already exist");
    
   }
    // const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log(req.files);
   const avatarLocalPath = req.files?.avatar?.[0];
//    if you know its required field use above path 
//    const coverImageLocalPath = req.files?.coverImage?.[0];
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
   }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath.path);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    // check if user is created or not
   const createdUser =  await User.findById(user._id).select(
    "-password -refreshToken"
   )

//    now we can check
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering user")
    }

    
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully <& - &>")
    )

});

const loginUser = asyncHandler(async(req,res)=>{

    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    const {email,username,password} = req.body

    if(!email && !username){
        throw new ApiError(400,"Email or username should be present")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
        // mongoose or operator can be used using dollor symbol

    })

    if(!user){
        throw new ApiError(404,"User doesnot exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect ")
    }

    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(-password -refreshToken)
    
    // server side management only 
    const options = {
        httpOnly:true,
        secure:true
    } 
    
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user:loggedInUser,accessToken,refreshToken
            // this is good practice for application development projects

        },
        "User Logged in successfully"
        )
    )   
})

const logoutUser = asyncHandler(async(req,res) =>{
    // remove database refresh token and cookies that is storing login
    // refreshtoken and acess token 
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{refreshToken:undefined}
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    console.log("logout successfuly");
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out Successfully"))
})


const refreshAcessToken = asyncHandler(async(req,res)=>{
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incommingRefreshToken){
        throw new ApiError(401,"Unauthorized request !!!!!!!!!")
    }

    try {
        const decodedtoken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedtoken?._id)
    
        if(!user){
            throw new ApiError(402,"Invalid Refresh token from user controller!!!!!")
        }
    
    
        if(user?.refreshToken !== incommingRefreshToken){
            throw new ApiError(402, "Invalid Refresh token is used !!!!!")
        }
        const options = {
            httpOnly:true,
            secure:true
        }
        
        const {accessToken,refreshToken} = await generateAccessTokenAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(200,{refreshToken:refreshToken},
                "Access Token Refreshed"
            )
        )

    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    
    const {oldPassword,newpassword} = req.body

    const user = await User.findById(req.user?._id)

    // first checking old password is correct or not
    const  isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old Password !!!!!")
    }

    
  

        user.password = newpassword
        await user.save({validateBeforeSave:false})

        return res
        .status(200)
        .json(new ApiResponse(200,{},"Password is changed successfully"))
    
    

})


const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
        .json(new ApiResponse(200, req.user, "Current User feteched succesfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{

    const {fullName,email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {   
            // mongod operators aggregation functions etc
            $set:{
                fullName:fullName,
                email:email,


            }

        },
        {new:true}
        // update hone ke bad information return hoti hai
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async(req,res)=>{

    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }

    // this is cloudinary object not url we need specific url from that object

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user  = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },{
            new:true
        }.select("-password")
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar Image uploaded successfully")
        )

})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverLocalPath = req.file?.path
    if (!coverLocalPath) {
        throw new ApiError(400, "cover image file is missing")
    }

    // this is cloudinary object not url we need specific url from that object

    const coverImage = await uploadOnCloudinary(avatarLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        }, {
            new: true
        }).select("-password")
// added

        return res
        .status(200)
        .json(
            new ApiResponse(200,user,"Cover Image uploaded successfully")
        )
    

})


const getUserChannelProfile = asyncHandler(async(req,res)=>{

    const {userName} = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    // aggregation pipelines
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
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
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                // createdAt: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )



})
// add practice controllers for now 

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        )
})


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAcessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};
