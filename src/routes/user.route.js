import { Router } from "express";
import {loginUser, logoutUser, refreshAccessToken, registerUser} from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]

    ),
    registerUser);

router.route('/login').post(loginUser);

//protected route
router.route('/logout').post(verifyJWT,  logoutUser);
//we don't need verifyToken for this route , because in the controller itself we have taken care of token
router.route('/refresh-token').post(refreshAccessToken);



export default router;