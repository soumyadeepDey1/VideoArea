import { Router } from "express";
import { registerUser, loginUser , logoutUser} from "../controllers/user.controllers.js";
const router = Router();
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"
import { refreshAccessToken } from "../controllers/user.controllers.js";
router.route("/register").post(
    upload.fields([
        {
            name: 'avatar', maxCount: 1
        },
        {
            name: 'cover', maxCount: 1
        }
    ]),
    registerUser);
router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT ,logoutUser);

router.route("/refreshToken").post(refreshAccessToken)
export default router;