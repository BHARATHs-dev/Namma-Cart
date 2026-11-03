const multer = require("multer");
const { errorResponse } = require("./validation");

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      const error = new Error("Only JPEG, PNG, WebP, GIF, or AVIF image files are allowed.");
      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  },
});

function uploadProductImages(req, res, next) {
  upload.array("images", 5)(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return errorResponse(res, statusCode, error.message);
    }

    if (error.statusCode) {
      return errorResponse(res, error.statusCode, error.message);
    }

    return next(error);
  });
}

module.exports = uploadProductImages;
