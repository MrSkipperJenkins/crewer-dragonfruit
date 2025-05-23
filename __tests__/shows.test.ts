import request from 'supertest';
import { app } from './setup';

describe('Shows API Endpoints', () => {
  // Variables for test data
  const demoWorkspaceId = 'cc7df93a-dfc3-4dda-9832-a7f5f20a3b1e';
  let createdShowId: string;

  // Test data for creating a show
  const testShow = {
    title: 'Test Show',
    description: 'Test show description',
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 90000000).toISOString(),   // Tomorrow + 1 hour
    status: 'scheduled',
    workspaceId: demoWorkspaceId
  };

  // GET /api/workspaces/:workspaceId/shows
  test('GET /api/workspaces/:workspaceId/shows should return all shows for a workspace', async () => {
    const response = await request(app).get(`/api/workspaces/${demoWorkspaceId}/shows`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('title');
    expect(response.body[0]).toHaveProperty('workspaceId', demoWorkspaceId);
  });

  // GET /api/shows/:id
  test('GET /api/shows/:id should return a specific show', async () => {
    // First get a list of shows to find a valid ID
    const listResponse = await request(app).get(`/api/workspaces/${demoWorkspaceId}/shows`);
    const showId = listResponse.body[0].id;
    
    const response = await request(app).get(`/api/shows/${showId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', showId);
    expect(response.body).toHaveProperty('title');
  });

  // POST /api/shows
  test('POST /api/shows should create a new show', async () => {
    const response = await request(app)
      .post('/api/shows')
      .send(testShow);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title', testShow.title);
    expect(response.body).toHaveProperty('workspaceId', demoWorkspaceId);
    
    // Save the ID for later tests
    createdShowId = response.body.id;
  });

  // PUT /api/shows/:id
  test('PUT /api/shows/:id should update a show', async () => {
    const updatedData = {
      title: 'Updated Test Show',
      description: 'Updated test show description'
    };

    const response = await request(app)
      .put(`/api/shows/${createdShowId}`)
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', createdShowId);
    expect(response.body).toHaveProperty('title', updatedData.title);
    expect(response.body).toHaveProperty('description', updatedData.description);
  });

  // DELETE /api/shows/:id
  test('DELETE /api/shows/:id should delete a show', async () => {
    const response = await request(app).delete(`/api/shows/${createdShowId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    
    // Verify it's deleted
    const verifyResponse = await request(app).get(`/api/shows/${createdShowId}`);
    expect(verifyResponse.status).toBe(404);
  });

  // GET /api/workspaces/:workspaceId/shows with date range filter
  test('GET /api/workspaces/:workspaceId/shows with date range should filter shows', async () => {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // One week later
    
    const response = await request(app)
      .get(`/api/workspaces/${demoWorkspaceId}/shows`)
      .query({ 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});