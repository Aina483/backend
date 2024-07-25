import asyncHandler from '../utils/asyncHandler.js'
import z from 'zod';
import {User} from '../models/users.models.js';
import ApiError from '../utils/ApiError.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';



const registrationSchema = z.object({
    username: z.string().min(3).nonempty({ message: "Username cannot be empty" }),
    fullName: z.string().min(6).nonempty({ message: "Fullname cannot be empty" }),
    email: z.string().email().nonempty({ message: "Email cannot be empty" }),
    password: z.string().min(8).nonempty({ message: "Password cannot be empty" })
  });

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

export default registerUser;

