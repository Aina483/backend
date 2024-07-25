import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/users.models.js";

//verify whether the user is present or not
//this will be used in our protected routes as well
 export const  verifyJWT=asyncHandler(async(req,res,next)=>{
    //get the token from cookies
    try {
        const token=req.cookie?.accessToken || req.header('Authorization')?.replace("Bearer " , "");
    
        if(!token){
            throw new ApiError(401, "Unauthorized access");
        }
    
        //if token exist then we need to verify the token
        /*the verify method of jwt will return the decoded object that was passed 
         in signing the token jwt.sign()
         */
    
         const decoded=jwt.verify(token , process.env.ACCESS_TOKEN_SECRET);
         const user =await User.findById(decoded._id);
    
         if(!user){
            throw new ApiError(401, "invalid access token");
         }
    
         req.user=user;
         next();
    
    } catch (error) {
        throw new ApiError(401 , "Invalid details");
    }


 })
