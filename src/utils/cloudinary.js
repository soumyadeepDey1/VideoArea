import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload
    (localFilePath,{
        resource_type: 'auto'
    })
    //console.log("file uploaded to cloudinary", response.url);
    fs.unlinkSync(localFilePath)
    return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // Delete the local file if upload fails
        return null;;
    }
}

const deleteResource = async (publicId) => {
    try {
        if (!publicId) return null;
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'auto'
        });
        return response;
    } catch (error) {
        console.error("Error deleting resource from Cloudinary:", error);
        return null;
    }
}

export {uploadOnCloudinary, deleteResource};