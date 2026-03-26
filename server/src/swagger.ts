import swaggerJsdoc from "swagger-jsdoc";

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Women Empowerment API", version: "1.0.0" },
    servers: [{ url: "http://localhost:4000" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/health": {
        get: { tags: ["Health"], summary: "Health check", security: [], responses: { 200: { description: "OK" } } },
      },

      // AUTH
      "/api/auth/me": {
        get: { tags: ["Auth"], summary: "Get current user", responses: { 200: { description: "User info" }, 401: { description: "Unauthorized" } } },
      },

      // COURSES
      "/api/courses": {
        get: { tags: ["Courses"], summary: "List all courses", security: [], responses: { 200: { description: "Array of courses" } } },
        post: {
          tags: ["Courses"], summary: "Create course (admin)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object", required: ["title", "description", "category", "lessons"],
                  properties: {
                    title: { type: "string" }, description: { type: "string" }, category: { type: "string" },
                    lessons: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } } } },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Created" }, 400: { description: "Bad request" } },
        },
      },
      "/api/courses/{id}": {
        get: { tags: ["Courses"], summary: "Get course by ID", security: [], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Course" }, 404: { description: "Not found" } } },
        put: {
          tags: ["Courses"], summary: "Update course (admin)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, category: { type: "string" } } } } } },
          responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: { tags: ["Courses"], summary: "Delete course (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 204: { description: "Deleted" } } },
      },
      "/api/courses/{id}/progress": {
        get: { tags: ["Courses"], summary: "Get learner progress for a course", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Progress" } } },
      },
      "/api/courses/{courseId}/lessons/{lessonId}/complete": {
        post: {
          tags: ["Courses"], summary: "Mark lesson complete (learner)",
          parameters: [
            { name: "courseId", in: "path", required: true, schema: { type: "string" } },
            { name: "lessonId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { 200: { description: "OK" }, 404: { description: "Not found" } },
        },
      },

      // JOBS
      "/api/jobs": {
        get: { tags: ["Jobs"], summary: "List all jobs", security: [], responses: { 200: { description: "Array of jobs" } } },
        post: {
          tags: ["Jobs"], summary: "Post a job (employer)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object", required: ["title", "description"],
                  properties: { title: { type: "string" }, description: { type: "string" }, location: { type: "string" }, salary: { type: "string" } },
                },
              },
            },
          },
          responses: { 201: { description: "Created" }, 400: { description: "Bad request" } },
        },
      },
      "/api/jobs/mine": {
        get: { tags: ["Jobs"], summary: "Get employer's own jobs", responses: { 200: { description: "Array of jobs" } } },
      },
      "/api/jobs/{id}": {
        delete: { tags: ["Jobs"], summary: "Delete job (employer)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 204: { description: "Deleted" }, 404: { description: "Not found" } } },
      },

      // APPLICATIONS
      "/api/applications": {
        post: {
          tags: ["Applications"], summary: "Apply for a job (learner)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["jobId"], properties: { jobId: { type: "string" }, coverLetter: { type: "string" } } } } },
          },
          responses: { 201: { description: "Created" }, 400: { description: "Bad request" } },
        },
      },
      "/api/applications/mine": {
        get: { tags: ["Applications"], summary: "Get learner's own applications", responses: { 200: { description: "Array of applications" } } },
      },
      "/api/applications/for-job/{jobId}": {
        get: { tags: ["Applications"], summary: "Get applications for a job (employer)", parameters: [{ name: "jobId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Array of applications" } } },
      },
      "/api/applications/{id}/status": {
        patch: {
          tags: ["Applications"], summary: "Update application status (employer)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["pending", "reviewed", "shortlisted", "rejected"] } } } } } },
          responses: { 200: { description: "Updated" }, 403: { description: "Forbidden" } },
        },
      },

      // PROFILE
      "/api/profile": {
        get: { tags: ["Profile"], summary: "Get own profile", responses: { 200: { description: "Profile" } } },
        patch: {
          tags: ["Profile"], summary: "Update own profile",
          requestBody: { content: { "application/json": { schema: { type: "object", properties: { headline: { type: "string" }, bio: { type: "string" }, phone: { type: "string" }, location: { type: "string" }, skills: { type: "array", items: { type: "string" } } } } } } },
          responses: { 200: { description: "Updated" } },
        },
      },
      "/api/profile/cv": {
        get: { tags: ["Profile"], summary: "Get CV data", responses: { 200: { description: "CV data" } } },
        put: {
          tags: ["Profile"], summary: "Save CV data",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { fullName: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, location: { type: "string" }, summary: { type: "string" }, skills: { type: "string" }, experience: { type: "string" }, education: { type: "string" } },
                },
              },
            },
          },
          responses: { 200: { description: "Saved" } },
        },
      },

      // RESOURCES
      "/api/resources": {
        get: { tags: ["Resources"], summary: "List all resources", security: [], responses: { 200: { description: "Array of resources" } } },
        post: {
          tags: ["Resources"], summary: "Create resource (admin)",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title", "type", "url"], properties: { title: { type: "string" }, type: { type: "string", enum: ["pdf", "link", "video"] }, url: { type: "string" }, description: { type: "string" } } } } } },
          responses: { 201: { description: "Created" } },
        },
      },
      "/api/resources/{id}": {
        put: { tags: ["Resources"], summary: "Update resource (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, type: { type: "string" }, url: { type: "string" }, description: { type: "string" } } } } } }, responses: { 200: { description: "Updated" } } },
        delete: { tags: ["Resources"], summary: "Delete resource (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 204: { description: "Deleted" } } },
      },

      // CERTIFICATES
      "/api/certificates": {
        get: { tags: ["Certificates"], summary: "List all certificates (admin)", responses: { 200: { description: "Array of certificates" } } },
      },
      "/api/certificates/mine": {
        get: { tags: ["Certificates"], summary: "Get own certificates (learner)", responses: { 200: { description: "Array of certificates" } } },
      },

      // NOTIFICATIONS
      "/api/notifications": {
        get: { tags: ["Notifications"], summary: "Get own notifications", responses: { 200: { description: "Array of notifications" } } },
      },
      "/api/notifications/{id}/read": {
        patch: { tags: ["Notifications"], summary: "Mark notification as read", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } },
      },
      "/api/notifications/read-all": {
        post: { tags: ["Notifications"], summary: "Mark all notifications as read", responses: { 200: { description: "OK" } } },
      },

      // DASHBOARD
      "/api/dashboard/learner": {
        get: { tags: ["Dashboard"], summary: "Learner dashboard stats", responses: { 200: { description: "Stats" } } },
      },
      "/api/dashboard/employer": {
        get: { tags: ["Dashboard"], summary: "Employer dashboard stats", responses: { 200: { description: "Stats" } } },
      },
      "/api/dashboard/admin": {
        get: { tags: ["Dashboard"], summary: "Admin dashboard stats", responses: { 200: { description: "Stats" } } },
      },
    },
  },
  apis: [],
});

export default spec;
