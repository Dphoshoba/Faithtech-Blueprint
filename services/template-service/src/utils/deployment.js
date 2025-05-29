const AWS = require('aws-sdk');
const { generateHTML } = require('./templateRenderer');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

// Helper to generate deployment URL
const generateDeploymentUrl = (instance) => {
  const orgId = instance.organization.toString();
  const instanceId = instance._id.toString();
  return `${orgId}/${instanceId}`;
};

// Helper to upload files to S3
const uploadToS3 = async (key, content, contentType) => {
  const params = {
    Bucket: process.env.AWS_DEPLOYMENT_BUCKET,
    Key: key,
    Body: content,
    ContentType: contentType,
    ACL: 'public-read'
  };

  await s3.putObject(params).promise();
  return `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`;
};

// Helper to invalidate CloudFront cache
const invalidateCache = async (paths) => {
  const params = {
    DistributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: paths.length,
        Items: paths.map(path => `/${path}`)
      }
    }
  };

  await cloudfront.createInvalidation(params).promise();
};

// Main deployment function
exports.deployInstance = async (instance) => {
  try {
    // Generate deployment path
    const deploymentPath = generateDeploymentUrl(instance);
    
    // Generate HTML, CSS, and JS from template and customizations
    const { html, css, js } = await generateHTML(instance);

    // Upload files to S3
    const htmlUrl = await uploadToS3(
      `${deploymentPath}/index.html`,
      html,
      'text/html'
    );

    const cssUrl = await uploadToS3(
      `${deploymentPath}/styles.css`,
      css,
      'text/css'
    );

    const jsUrl = await uploadToS3(
      `${deploymentPath}/script.js`,
      js,
      'application/javascript'
    );

    // Invalidate CloudFront cache
    await invalidateCache([
      `${deploymentPath}/index.html`,
      `${deploymentPath}/styles.css`,
      `${deploymentPath}/script.js`
    ]);

    return {
      success: true,
      url: htmlUrl,
      message: 'Deployment completed successfully'
    };
  } catch (error) {
    console.error('Deployment error:', error);
    return {
      success: false,
      message: `Deployment failed: ${error.message}`
    };
  }
};

// Update existing deployment
exports.updateDeployment = async (instance) => {
  try {
    // Check if deployment exists
    if (!instance.deploymentDetails?.url) {
      return await exports.deployInstance(instance);
    }

    // Generate deployment path
    const deploymentPath = generateDeploymentUrl(instance);
    
    // Generate updated HTML, CSS, and JS
    const { html, css, js } = await generateHTML(instance);

    // Update files in S3
    await Promise.all([
      uploadToS3(`${deploymentPath}/index.html`, html, 'text/html'),
      uploadToS3(`${deploymentPath}/styles.css`, css, 'text/css'),
      uploadToS3(`${deploymentPath}/script.js`, js, 'application/javascript')
    ]);

    // Invalidate CloudFront cache
    await invalidateCache([
      `${deploymentPath}/index.html`,
      `${deploymentPath}/styles.css`,
      `${deploymentPath}/script.js`
    ]);

    return {
      success: true,
      url: instance.deploymentDetails.url,
      message: 'Deployment updated successfully'
    };
  } catch (error) {
    console.error('Deployment update error:', error);
    return {
      success: false,
      message: `Deployment update failed: ${error.message}`
    };
  }
};

// Delete deployment
exports.deleteDeployment = async (instance) => {
  try {
    const deploymentPath = generateDeploymentUrl(instance);
    
    // Delete files from S3
    const params = {
      Bucket: process.env.AWS_DEPLOYMENT_BUCKET,
      Delete: {
        Objects: [
          { Key: `${deploymentPath}/index.html` },
          { Key: `${deploymentPath}/styles.css` },
          { Key: `${deploymentPath}/script.js` }
        ],
        Quiet: false
      }
    };

    await s3.deleteObjects(params).promise();

    // Invalidate CloudFront cache
    await invalidateCache([
      `${deploymentPath}/index.html`,
      `${deploymentPath}/styles.css`,
      `${deploymentPath}/script.js`
    ]);

    return {
      success: true,
      message: 'Deployment deleted successfully'
    };
  } catch (error) {
    console.error('Deployment deletion error:', error);
    return {
      success: false,
      message: `Deployment deletion failed: ${error.message}`
    };
  }
}; 