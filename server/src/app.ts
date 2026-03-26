import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";
import authRoutes from "./routes/auth";
import coursesRoutes from "./routes/courses";
import jobsRoutes from "./routes/jobs";
import applicationsRoutes from "./routes/applications";
import resourcesRoutes from "./routes/resources";
import profileRoutes from "./routes/profile";
import certificatesRoutes from "./routes/certificates";
import notificationsRoutes from "./routes/notifications";
import dashboardRoutes from "./routes/dashboard";

export function createApp() {
  const app = express();
  const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL,
  ].filter(Boolean) as string[];

  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json());

  app.get("/", (_req, res) => res.json({ message: "API is running" }));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/courses", coursesRoutes);
  app.use("/api/jobs", jobsRoutes);
  app.use("/api/applications", applicationsRoutes);
  app.use("/api/resources", resourcesRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/certificates", certificatesRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  return app;
}
