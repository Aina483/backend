import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app=express();
//connecting backend with the frontend, use is always used with middlewares 
app.use(cors());

//to accept json as request
//the limit is for adding limit to the server to get limited json, so that it doesn't crash
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded());
app.use(cookieParser());

//import router
import UserRouter from './routes/user.route.js';

app.use('/api/v1/user' , UserRouter)



export default app;