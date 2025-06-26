import request from "supertest";
import { app } from "./setup.js";

describe("Workspace API Endpoints", () => {
  // Variables for test data
  const demoWorkspaceId = "cc7df93a-dfc3-4dda-9832-a7f5f20a3b1e";
  let createdWorkspaceId: string;

  // GET /api/workspaces
  test("GET /api/workspaces should return all workspaces", async () => {
    const response = await request(app).get("/api/workspaces");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty("id");
    expect(response.body[0]).toHaveProperty("name");
  });

  // GET /api/workspaces/:id
  test("GET /api/workspaces/:id should return a specific workspace", async () => {
    const response = await request(app).get(
      `/api/workspaces/${demoWorkspaceId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", demoWorkspaceId);
    expect(response.body).toHaveProperty("name");
  });

  // GET /api/workspaces/:id - Not Found
  test("GET /api/workspaces/:id should return 404 for non-existent workspace", async () => {
    const response = await request(app).get("/api/workspaces/non-existent-id");

    expect(response.status).toBe(404);
  });

  // POST /api/workspaces
  test("POST /api/workspaces should create a new workspace", async () => {
    const newWorkspace = {
      name: "Test Workspace",
    };

    const response = await request(app)
      .post("/api/workspaces")
      .send(newWorkspace);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name", newWorkspace.name);

    // Save the ID for later tests
    createdWorkspaceId = response.body.id;
  });

  // PUT /api/workspaces/:id
  test("PUT /api/workspaces/:id should update a workspace", async () => {
    const updatedData = {
      name: "Updated Test Workspace",
    };

    const response = await request(app)
      .put(`/api/workspaces/${createdWorkspaceId}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", createdWorkspaceId);
    expect(response.body).toHaveProperty("name", updatedData.name);
  });

  // DELETE /api/workspaces/:id
  test("DELETE /api/workspaces/:id should delete a workspace", async () => {
    const response = await request(app).delete(
      `/api/workspaces/${createdWorkspaceId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);

    // Verify it's deleted
    const verifyResponse = await request(app).get(
      `/api/workspaces/${createdWorkspaceId}`,
    );
    expect(verifyResponse.status).toBe(404);
  });
});
