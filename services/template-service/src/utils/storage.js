const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

// Helper to generate unique file name
const generateFileName = (originalName) => {
  const extension = mime.extension(mime.lookup(originalName));
  return `${uuidv4()}.${extension}`;
};

// Upload file to S3
exports.uploadToS3 = async (file, folder = '') => {
  try {
    const fileName = generateFileName(file.originalname);
    const key = folder ? `${folder}/${fileName}` : fileName;

    const params = {
      Bucket: process.env.AWS_UPLOAD_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

// Delete file from S3
exports.deleteFromS3 = async (fileUrl) => {
  try {
    // Extract key from URL
    const key = fileUrl.split('/').slice(3).join('/');

    const params = {
      Bucket: process.env.AWS_UPLOAD_BUCKET,
      Key: key
    };

    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

// Get file from S3
exports.getFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_UPLOAD_BUCKET,
      Key: key
    };

    const data = await s3.getObject(params).promise();
    return {
      content: data.Body,
      contentType: data.ContentType
    };
  } catch (error) {
    console.error('S3 get error:', error);
    throw new Error(`Failed to get file: ${error.message}`);
  }
};

// List files in S3 folder
exports.listS3Files = async (prefix = '') => {
  try {
    const params = {
      Bucket: process.env.AWS_UPLOAD_BUCKET,
      Prefix: prefix
    };

    const data = await s3.listObjectsV2(params).promise();
    return data.Contents.map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      url: `https://${process.env.AWS_UPLOAD_BUCKET}.s3.amazonaws.com/${item.Key}`
    }));
  } catch (error) {
    console.error('S3 list error:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
};

// Generate pre-signed URL for direct upload
exports.getPresignedUploadUrl = async (fileName, contentType, folder = '') => {
  try {
    const key = folder ? `${folder}/${fileName}` : fileName;

    const params = {
      Bucket: process.env.AWS_UPLOAD_BUCKET,
      Key: key,
      ContentType: contentType,
      Expires: 3600, // URL expires in 1 hour
      ACL: 'public-read'
    };

    return await s3.getSignedUrlPromise('putObject', params);
  } catch (error) {
    console.error('Presigned URL error:', error);
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
};

// Generate pre-signed URL for download
exports.getPresignedDownloadUrl = async (key, expires = 3600) => {
  try {
    const params = {
      Bucket: process.env.AWS_UPLOAD_BUCKET,
      Key: key,
      Expires: expires
    };

    return await s3.getSignedUrlPromise('getObject', params);
  } catch (error) {
    console.error('Presigned URL error:', error);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
}; 