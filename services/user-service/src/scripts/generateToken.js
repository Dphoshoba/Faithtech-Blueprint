const generateJWT = require('../utils/jwtGenerator');

const [,, userId, role, ...extraPermissions] = process.argv;
if (!userId || !role) {
  console.log('Usage: node generateToken.js <userId> <role> [extraPermission1 extraPermission2 ...]');
  process.exit(1);
}

const token = generateJWT({ userId, role, extraPermissions });
console.log('JWT:', token); 