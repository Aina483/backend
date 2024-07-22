// require('dotenv').config({path:'/env'});
// const express=requie('express');
import dotenv  from "dotenv";
dotenv.config({
    path:'./env'
})
import connectDB from "./db/connection.js";



connectDB();