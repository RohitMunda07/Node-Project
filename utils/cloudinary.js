import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
import { ApiError } from "./ApiErrors.js";

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

const deleteOnCloudinary = async (oldFileId) => {
    if (!oldFileId) {
        throw new ApiError(500, "Deleting file with no path")
    }

    try {
        const urlPart = oldFileId.split('/')
        const folderName = urlPart[urlPart.length - 2] // e.g. 'myfolder'
        const fileWithExt = urlPart[urlPart.length - 1]  // e.g. 'avatar_abc123.png'
        const fileName = fileWithExt.split('.')[0]
        const public_id = `${folderName}/${fileName}`; // e.g. 'myfolder/avatar_abc123'

        console.log('public_id: ', public_id);

        const result = await cloudinary.uploader.destroy(fileName)

        console.log("✅ Deleted:", result);
    } catch (error) {
        console.error("❌ Deletion failed:", error);
        throw new ApiError(500, "Failed to delete file from Cloudinary");
    }
}

// Upload Video
const uploadVideoOnCloudinary = async (localFilePath) => {
    console.log("Checking if file exists:", localFilePath);
    console.log("Exists:", fs.existsSync(localFilePath));

    try {
        if (!localFilePath) return null;

        const response = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_large(
                localFilePath,
                { resource_type: "video" },
                (error, result) => {
                    if (error) return reject(error);
                    return resolve(result);
                }
            );
        });

        console.log("Video Uploaded: ", response.secure_url);

        // ✅ Only delete after full success
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("File Unlinked");
        }

        return response;


    } catch (error) {
        fs.unlinkSync(localFilePath)
        throw new ApiError(400, "Error uploading video")
    }
}

export { uploadOnCloudinary, deleteOnCloudinary, uploadVideoOnCloudinary }