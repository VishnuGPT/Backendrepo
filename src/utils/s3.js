const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Upload file to S3 (private by default)
const uploadToS3 = async (file) => {
  if (!file) return null;

  const fileKey = `${uuidv4()}${path.extname(file.originalname)}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "private", // file remains private
  };

  await s3.upload(params).promise();

  // return ONLY the key (simpler for DB + controller)
  return fileKey;
};

// Generate signed URL (for viewing/downloading)
const getSignedUrlFromS3 = (fileKey, expiresInSeconds = 300) => {
  if (!fileKey) return null;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
    Expires: expiresInSeconds, // e.g. 300 = 5 minutes
  };

  return s3.getSignedUrl("getObject", params);
};

module.exports = {
  uploadToS3,
  getSignedUrlFromS3,
};
