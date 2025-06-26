import request from "supertest";
import { app } from "./setup.js";

describe("Crew Members API Endpoints", () => {
  // Variables for test data
  const demoWorkspaceId = "cc7df93a-dfc3-4dda-9832-a7f5f20a3b1e";
  let createdCrewMemberId: string;

  // Test data for creating a crew member
  const testCrewMember = {
    name: "Test Crew Member",
    email: "test.crew@example.com",
    phone: "555-123-4567",
    title: "Test Technician",
    workspaceId: demoWorkspaceId,
  };

  // GET /api/workspaces/:workspaceId/crew-members
  test("GET /api/workspaces/:workspaceId/crew-members should return all crew members for a workspace", async () => {
    const response = await request(app).get(
      `/api/workspaces/${demoWorkspaceId}/crew-members`,
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty("id");
    expect(response.body[0]).toHaveProperty("name");
    expect(response.body[0]).toHaveProperty("workspaceId", demoWorkspaceId);
  });

  // GET /api/crew-members/:id
  test("GET /api/crew-members/:id should return a specific crew member", async () => {
    // First get a list of crew members to find a valid ID
    const listResponse = await request(app).get(
      `/api/workspaces/${demoWorkspaceId}/crew-members`,
    );
    const crewMemberId = listResponse.body[0].id;

    const response = await request(app).get(
      `/api/crew-members/${crewMemberId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", crewMemberId);
    expect(response.body).toHaveProperty("name");
  });

  // POST /api/crew-members
  test("POST /api/crew-members should create a new crew member", async () => {
    const response = await request(app)
      .post("/api/crew-members")
      .send(testCrewMember);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name", testCrewMember.name);
    expect(response.body).toHaveProperty("email", testCrewMember.email);
    expect(response.body).toHaveProperty("workspaceId", demoWorkspaceId);

    // Save the ID for later tests
    createdCrewMemberId = response.body.id;
  });

  // PUT /api/crew-members/:id
  test("PUT /api/crew-members/:id should update a crew member", async () => {
    const updatedData = {
      name: "Updated Crew Member",
      title: "Updated Technician",
    };

    const response = await request(app)
      .put(`/api/crew-members/${createdCrewMemberId}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", createdCrewMemberId);
    expect(response.body).toHaveProperty("name", updatedData.name);
    expect(response.body).toHaveProperty("title", updatedData.title);
  });

  // DELETE /api/crew-members/:id
  test("DELETE /api/crew-members/:id should delete a crew member", async () => {
    const response = await request(app).delete(
      `/api/crew-members/${createdCrewMemberId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);

    // Verify it's deleted
    const verifyResponse = await request(app).get(
      `/api/crew-members/${createdCrewMemberId}`,
    );
    expect(verifyResponse.status).toBe(404);
  });

  // Tests for crew member jobs
  describe("Crew Member Jobs Endpoints", () => {
    const demoJobId = "24e8b8d0-68a7-4b27-9e1b-d20edc9a2b8a"; // Technical Director job ID
    let crewMemberId: string;
    let crewMemberJobId: string;

    beforeAll(async () => {
      // Create a new crew member to use in these tests
      const response = await request(app).post("/api/crew-members").send({
        name: "Job Test Crew Member",
        email: "job.test@example.com",
        phone: "555-123-9999",
        title: "Job Tester",
        workspaceId: demoWorkspaceId,
      });

      crewMemberId = response.body.id;
    });

    afterAll(async () => {
      // Clean up the created crew member
      await request(app).delete(`/api/crew-members/${crewMemberId}`);
    });

    test("POST /api/crew-member-jobs should assign a job to a crew member", async () => {
      const jobAssignment = {
        crewMemberId,
        jobId: demoJobId,
        workspaceId: demoWorkspaceId,
      };

      const response = await request(app)
        .post("/api/crew-member-jobs")
        .send(jobAssignment);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("crewMemberId", crewMemberId);
      expect(response.body).toHaveProperty("jobId", demoJobId);

      crewMemberJobId = response.body.id;
    });

    test("GET /api/workspaces/:workspaceId/crew-member-jobs should return all crew member jobs", async () => {
      const response = await request(app).get(
        `/api/workspaces/${demoWorkspaceId}/crew-member-jobs`,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test("GET /api/crew-members/:crewMemberId/jobs should return jobs for a crew member", async () => {
      const response = await request(app).get(
        `/api/crew-members/${crewMemberId}/jobs`,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("crewMemberId", crewMemberId);
    });

    test("DELETE /api/crew-member-jobs/:id should remove a job assignment", async () => {
      const response = await request(app).delete(
        `/api/crew-member-jobs/${crewMemberJobId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
    });
  });
});
