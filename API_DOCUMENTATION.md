# 📚 FaithTech Blueprint API Documentation

## 🔗 **Base URLs**

### Development
- **API Gateway**: `http://localhost:3000`
- **User Service**: `http://localhost:3005`
- **Assessment Service**: `http://localhost:3002`
- **Template Service**: `http://localhost:3003`
- **Analytics Service**: `http://localhost:3004`

### Production
- **API Gateway**: `https://api.faithtech-blueprint.com`
- **User Service**: `https://users.faithtech-blueprint.com`
- **Assessment Service**: `https://assessments.faithtech-blueprint.com`
- **Template Service**: `https://templates.faithtech-blueprint.com`
- **Analytics Service**: `https://analytics.faithtech-blueprint.com`

---

## 🔐 **Authentication**

All API endpoints require authentication unless specified otherwise.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "organization": "Example Church"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member",
    "organization": "64f8a1b2c3d4e5f6a7b8c9d1"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member",
    "organization": "64f8a1b2c3d4e5f6a7b8c9d1"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Refresh Token
```http
POST /api/auth/refresh
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👥 **User Management**

### Get Current User
```http
GET /api/users/me
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member",
    "organization": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Example Church"
    },
    "subscription": {
      "plan": "basic",
      "status": "active",
      "expiresAt": "2024-12-31T23:59:59.000Z"
    }
  }
}
```

### Update User Profile
```http
PUT /api/users/me
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "preferences": {
    "notifications": true,
    "theme": "light"
  }
}
```

### Get Organization Users (Admin Only)
```http
GET /api/users/organization
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "member",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

## 📊 **Assessment Management**

### Get All Assessments
```http
GET /api/assessments
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `category` (optional): Filter by category
- `status` (optional): Filter by status (draft, published, archived)

**Response:**
```json
{
  "success": true,
  "assessments": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "title": "Ministry Technology Assessment",
      "description": "Evaluate your ministry's current technology implementation",
      "type": "ministry-tech",
      "status": "published",
      "estimatedTime": 15,
      "questions": [
        {
          "id": "q1",
          "text": "Does your ministry have a mobile-responsive website?",
          "type": "multiple-choice",
          "options": [
            { "text": "No website", "value": 0 },
            { "text": "Non-responsive website", "value": 1 },
            { "text": "Partially responsive", "value": 2 },
            { "text": "Fully responsive", "value": 3 }
          ]
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Get Assessment by ID
```http
GET /api/assessments/{id}
```

**Response:**
```json
{
  "success": true,
  "assessment": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "title": "Ministry Technology Assessment",
    "description": "Evaluate your ministry's current technology implementation",
    "type": "ministry-tech",
    "status": "published",
    "estimatedTime": 15,
    "questions": [
      {
        "id": "q1",
        "text": "Does your ministry have a mobile-responsive website?",
        "type": "multiple-choice",
        "category": "Digital Presence",
        "weight": 2,
        "required": true,
        "options": [
          { "text": "No website", "value": 0 },
          { "text": "Non-responsive website", "value": 1 },
          { "text": "Partially responsive", "value": 2 },
          { "text": "Fully responsive", "value": 3 }
        ]
      }
    ],
    "categories": [
      {
        "name": "Digital Presence",
        "description": "Evaluation of online presence and digital footprint",
        "weight": 1
      }
    ],
    "metadata": {
      "estimatedTime": 15,
      "targetAudience": "Ministry Leadership"
    }
  }
}
```

### Create Assessment
```http
POST /api/assessments
```

**Request Body:**
```json
{
  "title": "Custom Assessment",
  "description": "A custom assessment for our organization",
  "type": "custom",
  "questions": [
    {
      "text": "How would you rate your current technology setup?",
      "type": "likert",
      "category": "Technology",
      "weight": 1,
      "required": true,
      "options": [
        { "text": "Very Poor", "value": 1 },
        { "text": "Poor", "value": 2 },
        { "text": "Average", "value": 3 },
        { "text": "Good", "value": 4 },
        { "text": "Excellent", "value": 5 }
      ]
    }
  ],
  "categories": [
    {
      "name": "Technology",
      "description": "Technology-related questions",
      "weight": 1
    }
  ]
}
```

### Start Assessment
```http
POST /api/assessments/{id}/start
```

**Response:**
```json
{
  "success": true,
  "responseId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "assessment": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "title": "Ministry Technology Assessment",
    "questions": [...]
  }
}
```

### Submit Assessment Response
```http
POST /api/assessments/{id}/submit
```

**Request Body:**
```json
{
  "responseId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "answers": [
    {
      "questionId": "q1",
      "answer": 3,
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "totalScore": 75,
    "maxScore": 100,
    "percentage": 75,
    "passed": true,
    "categoryScores": [
      {
        "category": "Digital Presence",
        "score": 75,
        "maxScore": 100,
        "percentage": 75
      }
    ],
    "recommendations": [
      "Consider implementing a mobile-responsive website",
      "Improve your social media engagement strategy"
    ]
  }
}
```

### Get Assessment Results
```http
GET /api/assessments/{id}/results
```

**Response:**
```json
{
  "success": true,
  "results": {
    "totalScore": 75,
    "maxScore": 100,
    "percentage": 75,
    "passed": true,
    "categoryScores": [...],
    "recommendations": [...],
    "completedAt": "2024-01-15T10:45:00.000Z"
  }
}
```

---

## 📄 **Template Management**

### Get All Templates
```http
GET /api/templates
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `category` (optional): Filter by category
- `type` (optional): Filter by type

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "Church Website Template",
      "description": "A modern website template for churches",
      "category": "church",
      "type": "website",
      "thumbnail": {
        "url": "https://example.com/thumbnails/church-website.jpg",
        "alt": "Church Website Template Preview"
      },
      "version": {
        "major": 1,
        "minor": 0,
        "patch": 0
      },
      "status": "published",
      "isPublic": true,
      "tags": ["church", "website", "modern"],
      "metadata": {
        "previewUrl": "https://preview.faithtech-blueprint.com/templates/church-website",
        "dependencies": ["bootstrap", "jquery"],
        "compatibility": ["chrome", "firefox", "safari"]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Get Template by ID
```http
GET /api/templates/{id}
```

**Response:**
```json
{
  "success": true,
  "template": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "name": "Church Website Template",
    "description": "A modern website template for churches",
    "category": "church",
    "type": "website",
    "components": [
      {
        "name": "Header",
        "type": "header",
        "content": {
          "html": "<header>...</header>",
          "css": ".header { ... }",
          "js": "// Header JavaScript"
        },
        "settings": {
          "logo": true,
          "navigation": true
        },
        "isCustomizable": true
      }
    ],
    "version": {
      "major": 1,
      "minor": 0,
      "patch": 0
    },
    "status": "published",
    "isPublic": true,
    "tags": ["church", "website", "modern"],
    "metadata": {
      "previewUrl": "https://preview.faithtech-blueprint.com/templates/church-website",
      "dependencies": ["bootstrap", "jquery"],
      "compatibility": ["chrome", "firefox", "safari"]
    }
  }
}
```

### Create Template
```http
POST /api/templates
```

**Request Body:**
```json
{
  "name": "Custom Template",
  "description": "A custom template for our organization",
  "category": "church",
  "type": "website",
  "components": [
    {
      "name": "Header",
      "type": "header",
      "content": {
        "html": "<header>...</header>",
        "css": ".header { ... }",
        "js": "// Header JavaScript"
      },
      "settings": {
        "logo": true,
        "navigation": true
      },
      "isCustomizable": true
    }
  ],
  "tags": ["custom", "church", "website"]
}
```

### Customize Template
```http
POST /api/templates/{id}/customize
```

**Request Body:**
```json
{
  "customizations": {
    "colors": {
      "primary": "#007bff",
      "secondary": "#6c757d"
    },
    "fonts": {
      "heading": "Arial",
      "body": "Helvetica"
    },
    "logo": "https://example.com/logo.png",
    "content": {
      "churchName": "Example Church",
      "address": "123 Main St, City, State 12345",
      "phone": "(555) 123-4567"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "customizedTemplate": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d5",
    "templateId": "64f8a1b2c3d4e5f6a7b8c9d4",
    "customizations": {...},
    "previewUrl": "https://preview.faithtech-blueprint.com/custom/64f8a1b2c3d4e5f6a7b8c9d5",
    "downloadUrl": "https://download.faithtech-blueprint.com/custom/64f8a1b2c3d4e5f6a7b8c9d5.zip"
  }
}
```

---

## 📈 **Analytics**

### Get Analytics Overview
```http
GET /api/analytics/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalAssessments": 25,
    "completedResponses": 180,
    "completionRate": 85.5,
    "totalTemplates": 12,
    "templateDownloads": 45,
    "period": {
      "last7Days": {
        "newUsers": 15,
        "completions": 25,
        "downloads": 8
      },
      "last30Days": {
        "newUsers": 45,
        "completions": 120,
        "downloads": 35
      }
    }
  }
}
```

### Get User Analytics
```http
GET /api/analytics/user
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assessmentsCompleted": 5,
    "templatesDownloaded": 3,
    "totalTimeSpent": 120,
    "averageScore": 78.5,
    "improvementAreas": [
      "Digital Presence",
      "Communication"
    ],
    "achievements": [
      "First Assessment",
      "Perfect Score",
      "Template Master"
    ]
  }
}
```

### Get Performance Metrics
```http
GET /api/analytics/performance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pageLoadTime": 1.2,
    "apiResponseTime": 150,
    "errorRate": 0.1,
    "uptime": 99.9,
    "activeUsers": 45,
    "sessions": 120
  }
}
```

---

## 💳 **Subscription Management**

### Get Current Subscription
```http
GET /api/subscriptions/current
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d6",
    "plan": {
      "id": "basic",
      "name": "Basic Plan",
      "price": 29.99,
      "interval": "monthly",
      "features": [
        "5 Users",
        "10 Templates",
        "5GB Storage",
        "API Access"
      ]
    },
    "status": "active",
    "currentPeriodStart": "2024-01-01T00:00:00.000Z",
    "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
    "usage": {
      "users": 3,
      "templates": 7,
      "storage": 2.5
    },
    "limits": {
      "users": 5,
      "templates": 10,
      "storage": 5
    }
  }
}
```

### Get Available Plans
```http
GET /api/subscriptions/plans
```

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "free",
      "name": "Free Plan",
      "price": 0,
      "interval": "monthly",
      "features": [
        "1 User",
        "3 Templates",
        "100MB Storage"
      ],
      "limits": {
        "users": 1,
        "templates": 3,
        "storage": 0.1
      }
    },
    {
      "id": "basic",
      "name": "Basic Plan",
      "price": 29.99,
      "interval": "monthly",
      "features": [
        "5 Users",
        "10 Templates",
        "5GB Storage",
        "API Access"
      ],
      "limits": {
        "users": 5,
        "templates": 10,
        "storage": 5
      }
    }
  ]
}
```

### Update Subscription
```http
PUT /api/subscriptions/current
```

**Request Body:**
```json
{
  "planId": "pro",
  "interval": "monthly"
}
```

---

## 🔗 **Integration Management**

### Get Integrations
```http
GET /api/integrations
```

**Response:**
```json
{
  "success": true,
  "integrations": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d7",
      "provider": "planning_center",
      "name": "Planning Center Online",
      "status": "connected",
      "lastSync": "2024-01-15T10:30:00.000Z",
      "capabilities": ["people", "groups", "giving", "events"]
    }
  ]
}
```

### Connect Integration
```http
POST /api/integrations/connect
```

**Request Body:**
```json
{
  "provider": "planning_center",
  "credentials": {
    "clientId": "your_client_id",
    "clientSecret": "your_client_secret"
  }
}
```

### Test Integration
```http
POST /api/integrations/{id}/test
```

**Response:**
```json
{
  "success": true,
  "message": "Connection successful",
  "data": {
    "people": 150,
    "groups": 25,
    "events": 10
  }
}
```

---

## ❌ **Error Responses**

### Authentication Error
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token",
  "code": 401
}
```

### Validation Error
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "code": 400,
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Not Found Error
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Resource not found",
  "code": 404
}
```

### Rate Limit Error
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests, please try again later",
  "code": 429,
  "retryAfter": 60
}
```

### Server Error
```json
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred",
  "code": 500
}
```

---

## 📝 **Rate Limits**

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| General API | 100 requests | 1 minute |
| File Upload | 10 requests | 1 minute |
| Assessment Submission | 5 requests | 1 minute |

---

## 🔧 **SDK Examples**

### JavaScript/TypeScript
```typescript
import { FaithTechAPI } from '@faithtech/blueprint-sdk';

const api = new FaithTechAPI({
  baseURL: 'https://api.faithtech-blueprint.com',
  token: 'your_jwt_token'
});

// Get assessments
const assessments = await api.assessments.getAll();

// Start assessment
const response = await api.assessments.start('assessment_id');

// Submit assessment
const results = await api.assessments.submit('assessment_id', {
  responseId: 'response_id',
  answers: [...]
});
```

### Python
```python
from faithtech_blueprint import FaithTechAPI

api = FaithTechAPI(
    base_url='https://api.faithtech-blueprint.com',
    token='your_jwt_token'
)

# Get assessments
assessments = api.assessments.get_all()

# Start assessment
response = api.assessments.start('assessment_id')

# Submit assessment
results = api.assessments.submit('assessment_id', {
    'responseId': 'response_id',
    'answers': [...]
})
```

---

## 📞 **Support**

- **Documentation**: https://docs.faithtech-blueprint.com
- **API Status**: https://status.faithtech-blueprint.com
- **Support Email**: support@faithtech-blueprint.com
- **Developer Portal**: https://developers.faithtech-blueprint.com

---

**Last Updated**: January 15, 2024  
**API Version**: v1.0.0
