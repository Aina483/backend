import dotenv from 'dotenv';
dotenv.config();
import mongoose from "mongoose";
// import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try{
        await mongoose.connect (`${process.env.MONGODB_URI}/${process.env.DB_NAME}`,{ useNewUrlParser: true, useUnifiedTopology: true });
        console.log("MongoDB connection successfull")
    }
    catch(error){
        console.error("MongoDB connection Failed ",error);
       
    }

}
export default connectDB;