import request from 'supertest';
import { app } from './setup.js';

describe('Resources API Endpoints', () => {
  // Variables for test data
  const demoWorkspaceId = 'cc7df93a-dfc3-4dda-9832-a7f5f20a3b1e';
  let createdResourceId: string;

  // Test data for creating a resource
  const testResource = {
    name: 'Test Resource',
    type: 'studio',
    description: 'Test resource description',
    workspaceId: demoWorkspaceId
  };

  // GET /api/workspaces/:workspaceId/resources
  test('GET /api/workspaces/:workspaceId/resources should return all resources for a workspace', async () => {
    const response = await request(app).get(`/api/workspaces/${demoWorkspaceId}/resources`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('workspaceId', demoWorkspaceId);
  });

  // GET /api/resources/:id
  test('GET /api/resources/:id should return a specific resource', async () => {
    // First get a list of resources to find a valid ID
    const listResponse = await request(app).get(`/api/workspaces/${demoWorkspaceId}/resources`);
    const resourceId = listResponse.body[0].id;
    
    const response = await request(app).get(`/api/resources/${resourceId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', resourceId);
    expect(response.body).toHaveProperty('name');
  });

  // POST /api/resources
  test('POST /api/resources should create a new resource', async () => {
    const response = await request(app)
      .post('/api/resources')
      .send(testResource);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', testResource.name);
    expect(response.body).toHaveProperty('type', testResource.type);
    expect(response.body).toHaveProperty('workspaceId', demoWorkspaceId);
    
    // Save the ID for later tests
    createdResourceId = response.body.id;
  });

  // PUT /api/resources/:id
  test('PUT /api/resources/:id should update a resource', async () => {
    const updatedData = {
      name: 'Updated Test Resource',
      description: 'Updated test resource description'
    };

    const response = await request(app)
      .put(`/api/resources/${createdResourceId}`)
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', createdResourceId);
    expect(response.body).toHaveProperty('name', updatedData.name);
    expect(response.body).toHaveProperty('description', updatedData.description);
  });

  // DELETE /api/resources/:id
  test('DELETE /api/resources/:id should delete a resource', async () => {
    const response = await request(app).delete(`/api/resources/${createdResourceId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    
    // Verify it's deleted
    const verifyResponse = await request(app).get(`/api/resources/${createdResourceId}`);
    expect(verifyResponse.status).toBe(404);
  });

  // Tests for Show Resources
  describe('Show Resources Endpoints', () => {
    let showId: string;
    let resourceId: string;
    let showResourceId: string;

    beforeAll(async () => {
      // Get an existing show and resource for testing
      const showsResponse = await request(app).get(`/api/workspaces/${demoWorkspaceId}/shows`);
      showId = showsResponse.body[0].id;
      
      const resourcesResponse = await request(app).get(`/api/workspaces/${demoWorkspaceId}/resources`);
      resourceId = resourcesResponse.body[0].id;
    });

    test('POST /api/show-resources should assign a resource to a show', async () => {
      const resourceAssignment = {
        showId,
        resourceId,
        workspaceId: demoWorkspaceId
      };

      const response = await request(app)
        .post('/api/show-resources')
        .send(resourceAssignment);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('showId', showId);
      expect(response.body).toHaveProperty('resourceId', resourceId);
      
      showResourceId = response.body.id;
    });

    test('GET /api/shows/:showId/resources should return resources for a show', async () => {
      const response = await request(app).get(`/api/shows/${showId}/resources`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('DELETE /api/show-resources/:id should remove a resource assignment', async () => {
      const response = await request(app).delete(`/api/show-resources/${showResourceId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});