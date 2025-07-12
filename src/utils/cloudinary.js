import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (filePath) => {
    try {
        if (!filePath) {
            throw new Error("File path is required");
        }
        if (!fs.existsSync(filePath)) {
            throw new Error("File does not exist");
        }
        const result = await cloudinary.uploader.upload(filePath, {
            folder: "socialMedia",
            resource_type: "auto",
        });
        fs.unlinkSync(filePath); // Remove the file after upload
        return result;
    } catch (error) {
        fs.unlinkSync(filePath); // Ensure the file is removed even if upload fails
        throw new Error(`Image upload failed: ${error.message}`);
    }
};

export { uploadImage };
