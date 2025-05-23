import request from 'supertest';
import { app } from './setup';

describe('Jobs API Endpoints', () => {
  // Variables for test data
  const demoWorkspaceId = 'cc7df93a-dfc3-4dda-9832-a7f5f20a3b1e';
  let createdJobId: string;

  // Test data for creating a job
  const testJob = {
    title: 'Test Job',
    description: 'Test job description',
    workspaceId: demoWorkspaceId
  };

  // GET /api/workspaces/:workspaceId/jobs
  test('GET /api/workspaces/:workspaceId/jobs should return all jobs for a workspace', async () => {
    const response = await request(app).get(`/api/workspaces/${demoWorkspaceId}/jobs`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('title');
    expect(response.body[0]).toHaveProperty('workspaceId', demoWorkspaceId);
  });

  // GET /api/jobs/:id
  test('GET /api/jobs/:id should return a specific job', async () => {
    // First get a list of jobs to find a valid ID
    const listResponse = await request(app).get(`/api/workspaces/${demoWorkspaceId}/jobs`);
    const jobId = listResponse.body[0].id;
    
    const response = await request(app).get(`/api/jobs/${jobId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', jobId);
    expect(response.body).toHaveProperty('title');
  });

  // POST /api/jobs
  test('POST /api/jobs should create a new job', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .send(testJob);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title', testJob.title);
    expect(response.body).toHaveProperty('description', testJob.description);
    expect(response.body).toHaveProperty('workspaceId', demoWorkspaceId);
    
    // Save the ID for later tests
    createdJobId = response.body.id;
  });

  // PUT /api/jobs/:id
  test('PUT /api/jobs/:id should update a job', async () => {
    const updatedData = {
      title: 'Updated Test Job',
      description: 'Updated test job description'
    };

    const response = await request(app)
      .put(`/api/jobs/${createdJobId}`)
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', createdJobId);
    expect(response.body).toHaveProperty('title', updatedData.title);
    expect(response.body).toHaveProperty('description', updatedData.description);
  });

  // DELETE /api/jobs/:id
  test('DELETE /api/jobs/:id should delete a job', async () => {
    const response = await request(app).delete(`/api/jobs/${createdJobId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    
    // Verify it's deleted
    const verifyResponse = await request(app).get(`/api/jobs/${createdJobId}`);
    expect(verifyResponse.status).toBe(404);
  });

  // Tests for Required Jobs
  describe('Required Jobs Endpoints', () => {
    let showId: string;
    let jobId: string;
    let requiredJobId: string;

    beforeAll(async () => {
      // Get an existing show and job for testing
      const showsResponse = await request(app).get(`/api/workspaces/${demoWorkspaceId}/shows`);
      showId = showsResponse.body[0].id;
      
      const jobsResponse = await request(app).get(`/api/workspaces/${demoWorkspaceId}/jobs`);
      jobId = jobsResponse.body[0].id;
    });

    test('POST /api/required-jobs should create a required job for a show', async () => {
      const requiredJob = {
        showId,
        jobId,
        workspaceId: demoWorkspaceId,
        quantity: 2,
        notes: 'Test required job notes'
      };

      const response = await request(app)
        .post('/api/required-jobs')
        .send(requiredJob);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('showId', showId);
      expect(response.body).toHaveProperty('jobId', jobId);
      expect(response.body).toHaveProperty('quantity', 2);
      
      requiredJobId = response.body.id;
    });

    test('GET /api/shows/:showId/required-jobs should return required jobs for a show', async () => {
      const response = await request(app).get(`/api/shows/${showId}/required-jobs`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('PUT /api/required-jobs/:id should update a required job', async () => {
      const updatedData = {
        quantity: 3,
        notes: 'Updated test required job notes'
      };

      const response = await request(app)
        .put(`/api/required-jobs/${requiredJobId}`)
        .send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', requiredJobId);
      expect(response.body).toHaveProperty('quantity', 3);
      expect(response.body).toHaveProperty('notes', 'Updated test required job notes');
    });

    test('DELETE /api/required-jobs/:id should delete a required job', async () => {
      const response = await request(app).delete(`/api/required-jobs/${requiredJobId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});