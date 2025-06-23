import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
import { ApiError } from "./ApiErrors";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload an image
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        console.log("File uploaded: ", response.url);
        // unlink files after upload to cloudinary
        fs.unlinkSync(localFilePath)
        console.log("File Unliked");
        console.log("Cloudinary Response: ", response);

        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // removes the locally saved temporary file as the upload operation got failed
        console.log("Error in Uploading File");
        return null
    }
}

const deleteOnCloudinary = async (oldFilePath) => {
    if (!oldFilePath) {
        throw new ApiError(500, "Deleting file with no path")
    }
    await cloudinary.uploader.destroy(oldFilePath)
}

export { uploadOnCloudinary, deleteOnCloudinary }