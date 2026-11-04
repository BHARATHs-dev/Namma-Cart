const cloudinary = require("cloudinary").v2;

function getCloudinaryClient() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    const error = new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
    error.statusCode = 503;
    throw error;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
}

function uploadImage(file, userId) {
  const client = getCloudinaryClient();

  return new Promise((resolve, reject) => {
    client.uploader
      .upload_stream(
        {
          folder: `namma-cart/products/${userId}`,
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "avif"],
        },
        (error, result) => {
          if (error) {
            const uploadError = new Error("Image upload to Cloudinary failed.");
            uploadError.statusCode = 502;
            uploadError.cause = error;
            reject(uploadError);
            return;
          }

          if (!result?.secure_url) {
            const uploadError = new Error("Cloudinary did not return a secure image URL.");
            uploadError.statusCode = 502;
            reject(uploadError);
            return;
          }

          resolve(result.secure_url);
        }
      )
      .end(file.buffer);
  });
}

async function uploadProductImages(files, userId) {
  return Promise.all(files.map((file) => uploadImage(file, userId)));
}

module.exports = {
  uploadProductImages,
};
