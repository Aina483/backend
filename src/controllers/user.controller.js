import asyncHandler from '../utils/asyncHandler.js'
import z from 'zod';
import {User} from '../models/users.models.js';
import ApiError from '../utils/ApiError.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';



const registrationSchema = z.object({
    username: z.string().min(3).nonempty({ message: "Username cannot be empty" }),
    fullName: z.string().min(6).nonempty({ message: "Fullname cannot be empty" }),
    email: z.string().email().nonempty({ message: "Email cannot be empty" }),
    password: z.string().min(8).nonempty({ message: "Password cannot be empty" })
  });


const generateAccessAndRefreshToken=async(userId)=>{
    //find the user
    try{
    const user= await User.findById(userId);
    const accessToken=user.createAccessToken();
    const refreshToken=user.generateRefreshToken();
    //refresh token will be saved in the database
    user.refreshToken=refreshToken;
    user.save({validateBeforeSave:false});

    console.log(accessToken);

    return {accessToken , refreshToken};
    }
    catch(error){
        throw new ApiError(500 , "something went wrong while generating access and refresh token");
    }
}


 const registerUser=asyncHandler(async(req,res)=>{
    
    const {username, fullName, email, password}=registrationSchema.parse(req.body);
    console.log("username:", username);


    //check if user araedy exist
    const existedUser=await User.findOne({
        $or:[{username} , {email}]
    }
    )

    if(existedUser){
        throw new ApiError(409, "User with username or email already exist" , )
    }

    //upload file through multer on local server 
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "File is required 1");
    }

    //upload file on cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    
    console.log(avatar.url);

    if(!avatar){
        throw new ApiError(400, "file is required 2");
    }

    const user=await User.create({
        username,
        fullName,
        email,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url,
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user");
    }

    console.log(createdUser);


    return res.json(new ApiResponse(200, "User registered successfully" , createdUser))
    



    

    
})

const loginUser=asyncHandler(async(req,res)=>{
    //get data from the req
    //check if user exists
    //if exists , then check password
    //give access and refresh token 
    //send cookies


    const {username , email , password}=req.body;
    // console.log(username);
    console.log(password);

    if(!(username || email)){
        throw new ApiError(400, "username or email is required");
    }

    const user =await User.findOne({
        $or:[{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "user does not exist");
    }

    //if user exist , check whether the password is correct or not
    //the methods that we created like isCorrectPassword etc , are the methods for the user not the mongoDb User model
    const isPasswordValid=await user.isCorrectPassword(password);

    if(!isPasswordValid){
        throw new ApiError(401, "invalid user crendentials");
    }

    //password is validated , now generate access and refresh token
    const {accessToken , refreshToken}=await generateAccessAndRefreshToken(user._id);

    //since earlier user does not has refreshToken in it , now we'll have to add refreshToken 
    //this loggedInUser will have refreshToken value present in it
    const loggedInUser=await User.findOne(user._id).select("-password -refreshToken");

    //add cookies
    //added security options in the cookie, 

    const options=
    {
        httpOnly:true,
        secure:true
    }

    res.status(200)
    .cookie("AccessToken" , accessToken , options)
    .cookie("RefreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
           200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken

            },
            "User logged in successfully!"

        )
    )



    

}) 

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshToken:undefined
            }
        }
    )

    const options=
    {
        httpOnly:true,
        secure:true
    }

    //remove cookies
    res.status(200)
    .clearCookie("AccessToken" , options)
    .clearCookie("RefreshToken" , options)
    .json(new ApiResponse(200 , {} , "User logged out"));

    // console.log(res);


})


const refreshAccessToken=asyncHandler(async(req,res)=>{
    //get the refreshToken from the cookie
    const incomingRefreshToken=req.cookies?.RefreshToken || req.body.refreshToken;
    console.log(incomingRefreshToken);

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized access");
    }

    //verify it with our refresh token, which will provide us with the decoded data
    //the decoded data here will include the user id

    const decodedToken=jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);

    if(!decodedToken){
        throw new ApiError(401, "invalid refresh token");
    }

    //find the user which has this refreshToken
    const user=await User.findById(decodedToken?._id);
    if(!user){
        throw new ApiError(401 , "invalid refresh token , it may be expired");
    }

    if(incomingRefreshToken!==user.refreshToken){
       throw new ApiError(401, "refrewsh token is expired or already used");
    }

    const options={
        httpOnly:true,
        secure:true
    }

    const {accessToken , newRefreshToken}=await generateAccessAndRefreshToken(user._id);

    return res
    .status(200)
    .cookie("AccessToken" , accessToken, options)
    .cookie("RefreshToken" , newRefreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                accessToken, refreshToken:newRefreshToken
            },
            "access token refreshed!!"
        )
    )
})


const changeCurrentPassword=asyncHandler(async(req , res)=>{
     const {oldPassword, newPassword}=req.body;

     //since we're changing the password , we'll alredy be logged in 
     //thus we'll get the user from the middleware , req.user=user
     const user=User.findById(req.user._id);
     if(!user){
        throw new ApiError(401 , "Unauthorized access");
     }

     const correctPassowrd=await user.isCorrectPassword(oldPassword);
     if(!correctPassowrd){
        throw new ApiError(401 , "Incorrect passowrd");
     }

     user.password=newPassword;
     await user.save({validateBeforeSave:false});

     return res
     .status(200)
     .json(
        new ApiResponse(200,
            {},
            "Pasoword changes succesfully!"
        )
     )
})

const currentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200 , req.user , "User fetched successfully!")
    )
})

const updateAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file.path;
    if(!avatarLocalPath){
        throw new ApiError(400 , "Invalid file path");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400 , "problem in uploading the file path");
    }

    //update the file
    const user =await User.findByIdAndUpdate(
        req.user._id,
    { $set: {avatar:avatar.url}},
    {new:true}).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200 , user, "Avatar image updated successfully!"))
})
//to get the channel and the subscribers
const getUserChannelProfile=asyncHandler(async(req,res)=>{
       const {username}=req.params;

       if(!username?.trim()){
        throw new ApiError(400 , "Username is missing");
       }

       //we'll apply aggregate pipeline
       //first stage will be to filter out the users
       const channel=await User.aggregate([
        //first stage:filtering , we'll use match pipeline
        {
            $match:{
                username:username
            }
        }, 
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"

            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"

            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedTo:{
                    $size:"$subscribedTo"
                }
            }
        } ,
        {
            $project:{
                username:1,
                fullName:1,
                subscriberCount:1,
                channelsSubscribedTo:1,
                avatar:1,

            }
        }
       ])

       if(!channel){
        throw new ApiError(404 , "Channel does not exist");
       }

       return res.status(200)
       .json(
        new ApiResponse(200 , channel[0]  , "User channel fetched successfully")
       )





})


export {registerUser , loginUser , logoutUser , refreshAccessToken ,
     changeCurrentPassword , currentUser , updateAvatar, getUserChannelProfile};

