// require('dotenv').config({path:'/env'});
// const express=requie('express');
import dotenv  from "dotenv";
dotenv.config({
    path:'./env'
})
import connectDB from "./db/connection.js";
import app from "./app.js";



connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`Server is listening on port : ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("mongodb connection failed",err);
})