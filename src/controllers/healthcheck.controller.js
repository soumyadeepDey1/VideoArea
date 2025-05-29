import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply return the OK status as json with a message


    


    res.status(200).json(
        new ApiResponse({
            success: true,
            message: "Server is healthy and running",
            data: {
                status: "OK"
            }
        })
    );
})

export {
    healthcheck
    }
    