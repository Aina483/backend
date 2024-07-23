import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';



   
    cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.CLOUD_API_KEY, 
        api_secret: process.env.CLOUD_API_SECRET 
    });

    //uploading file on the cloudinary using the link of the file from the local server 
    //and then unlinking it from the local server
    
    //since the file system may contain some errors therefore add this in the try catch block 
    const uploadOnCloudinary=async (localFilePath)=>{
      try{
        if(!localFilePath) return null;
        //upload file on clodinary
        const response = await cloudinary.uploader.upload(localFilePath , {
             resource_type:'auto'
        })

        console.log("File uploaded successfully on cloudinary" , response);
        console.log(response.url);
        }
      catch(error){
        //remove the file from the locals erver if the upload 
        //on cloudinary goes wrong
        fs.unlinkSync(localFilePath);
      }
    }

    export default uploadOnCloudinary;