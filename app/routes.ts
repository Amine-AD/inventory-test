import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("dashboard-v2", "routes/dashboard-v2.tsx"),
] satisfies RouteConfig;
