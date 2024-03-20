# raven-rookery
 
const { initRookery } from "raven-rookery";

const { getLocalizations, startServer } = await initRoost({
  apiKey,
  projectIds: ["string"],
  refreshFrequency: number,
  serverConfig: {
    endpoint: "string",
    port: number,
    languagesKey: "string",
    projectIdKey: "string",
    queryKey: "string",
    requestType: "GET" || "POST"
  }
});
