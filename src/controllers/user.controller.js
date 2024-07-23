import asyncHandler from '../utils/asyncHandler.js'
import z from 'zod';
import {User} from '../models/users.models.js';
import ApiError from '../utils/ApiError.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';



const registrationSchema = z.object({
    username: z.string().min(3).nonempty({ message: "Username cannot be empty" }),
    fullname: z.string().min(6).nonempty({ message: "Fullname cannot be empty" }),
    email: z.string().email().nonempty({ message: "Email cannot be empty" }),
    password: z.string().min(8).nonempty({ message: "Password cannot be empty" })
  });

const registerUser=asyncHandler(async(req,res)=>{
    
    const {userName, fullName, email, password}=registrationSchema.safeParse(req.body);
    console.log("email:", email);


    //check if user araedy exist
    const existedUser=User.findOne({
        $or:[{userName} , {email}]
    }
    )

    if(existedUser){
        throw new ApiError(409, "User with username or email already exist" , )
    }

    //upload file (avatar) to cloudinary
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "File is required");
    }

    
    const avatarPath=await uploadOnCloudinary(avatarLocalPath);
    const coverImagePath=await uploadOnCloudinary(coverImageLocalPath);

    if(!avatarPath){
        throw new ApiError(400, "file is required");
    }

    const user=await User.create({
        userName,
        fullName,
        email,
        password,
        avatar:avatarPath.url,
        coverImage:coverImagePath?.url,
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return json(new ApiResponse(200, "User registered successfully" , createdUser))




    

    
})

export default registerUser;

