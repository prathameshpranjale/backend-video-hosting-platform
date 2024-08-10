import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';
// this user can interact with mongodb directly 
import { ApiResponse } from '../utils/ApiResponse.js';

// this is method 
const generateAccessTokenAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        // acess and refresh token methods from user model
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        // adding refresh token to database
        User.refreshToken = refreshToken
        // saving the and adding this line of validate before save
        // cause we dont want to kickin the password check functionality 
        // so it is must add await as its gonna take some time
        await User.Save({validateBeforeSave:false})
        // also there is no need to hold such methods in any variable 

        // after saving return both tokens
        return {accessToken,refreshToken}


    }catch(error){
        throw new ApiError(500,"something went wrong while genereating refresh and acess token ")
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

    if(!email || !username){
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
        req.User._id,
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

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out Successfully"))
})
export { 
    registerUser,
    loginUser,
    logoutUser
};
