const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Template = require('../models/Template');
const templateController = require('../controllers/templateController');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Template.deleteMany({});
});

describe('Template Model Test', () => {
  it('should create & save template successfully', async () => {
    const validTemplate = new Template({
      title: 'Test Template',
      description: 'This is a test template description',
      category: 'worship',
      fileUrl: '/uploads/test.pdf',
      fileType: 'pdf',
      fileSize: 1024,
      createdBy: new mongoose.Types.ObjectId(),
      isPublic: true,
      tags: ['test', 'worship']
    });

    const savedTemplate = await validTemplate.save();
    expect(savedTemplate._id).toBeDefined();
    expect(savedTemplate.title).toBe(validTemplate.title);
    expect(savedTemplate.category).toBe(validTemplate.category);
  });

  it('should fail to save template without required fields', async () => {
    const templateWithoutRequiredField = new Template({ title: 'Test Template' });
    let err;
    try {
      await templateWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should fail to save template with invalid category', async () => {
    const templateWithInvalidCategory = new Template({
      title: 'Test Template',
      description: 'This is a test template description',
      category: 'invalid',
      fileUrl: '/uploads/test.pdf',
      fileType: 'pdf',
      fileSize: 1024,
      createdBy: new mongoose.Types.ObjectId()
    });

    let err;
    try {
      await templateWithInvalidCategory.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });
});

describe('Template Controller Test', () => {
  const mockRequest = () => {
    const req = {};
    req.body = {};
    req.params = {};
    req.query = {};
    req.user = { id: new mongoose.Types.ObjectId() };
    return req;
  };

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn();

  it('should create a new template', async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = {
      title: 'Test Template',
      description: 'This is a test template description',
      category: 'worship',
      tags: ['test', 'worship']
    };
    req.file = {
      path: '/uploads/test.pdf',
      mimetype: 'application/pdf',
      size: 1024
    };

    await templateController.createTemplate(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          template: expect.objectContaining({
            title: req.body.title,
            category: req.body.category
          })
        })
      })
    );
  });

  it('should get all templates with pagination', async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.query = { page: 1, limit: 10 };

    // Create some test templates
    await Template.create([
      {
        title: 'Template 1',
        description: 'Description 1',
        category: 'worship',
        fileUrl: '/uploads/test1.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        createdBy: req.user.id
      },
      {
        title: 'Template 2',
        description: 'Description 2',
        category: 'outreach',
        fileUrl: '/uploads/test2.pdf',
        fileType: 'pdf',
        fileSize: 2048,
        createdBy: req.user.id
      }
    ]);

    await templateController.getAllTemplates(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        results: 2,
        data: expect.objectContaining({
          templates: expect.arrayContaining([
            expect.objectContaining({
              title: 'Template 1',
              category: 'worship'
            }),
            expect.objectContaining({
              title: 'Template 2',
              category: 'outreach'
            })
          ])
        })
      })
    );
  });

  it('should search templates', async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.query = { q: 'Template', category: 'worship' };

    // Create test templates
    await Template.create([
      {
        title: 'Worship Template',
        description: 'A template for worship',
        category: 'worship',
        fileUrl: '/uploads/worship.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        createdBy: req.user.id
      },
      {
        title: 'Outreach Template',
        description: 'A template for outreach',
        category: 'outreach',
        fileUrl: '/uploads/outreach.pdf',
        fileType: 'pdf',
        fileSize: 2048,
        createdBy: req.user.id
      }
    ]);

    await templateController.searchTemplates(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          templates: expect.arrayContaining([
            expect.objectContaining({
              title: 'Worship Template',
              category: 'worship'
            })
          ])
        })
      })
    );
  });
}); 