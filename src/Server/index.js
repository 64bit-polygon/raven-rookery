import express from "express";

export const createStartServer = ({
  endpoint,
  port,
  languagesKey,
  projectIdKey,
  dataKey,
  requestType,
  getLocalizations
}) => {
  if (endpoint && endpoint[0] === "/") {
    endpoint = endpoint.substring(1);
  }
  endpoint = `/${endpoint ?? "localizations"}`;
  port = port ?? 3000;
  languagesKey = languagesKey ?? "languages";
  projectIdKey = projectIdKey ?? "projectId";
  dataKey = dataKey ?? "data";
  requestType = requestType === "POST" ? "POST" : "GET";

  const makeResponse = query => {
    const id = query[projectIdKey];
    const languages = query[languagesKey];

    return getLocalizations(id, languages);
  }

  const makeResponses = queries => {
    return queries.reduce((responses, query) => ({
      ...responses,
      [query[projectIdKey]]: makeResponse(query)
    }), {});
  }

  const startServer = () => {
    const app = express();
    app.use(express.json());

    if (requestType === "GET") {
      app.get(endpoint, (req, res) => {
        let query = req.query[dataKey];
        try {
          query = JSON.parse(query);
          const response = Array.isArray(query) ? makeResponses(query) : makeResponse(query);
          res.json(response);
        } catch (err) {
          console.error(err?.message)
          res.json({});
        }
      });
    }

    if (requestType === "POST") {
      app.post(endpoint, (req, res) => {
        try {
          const queries = req.body[dataKey];
          const response = Array.isArray(queries) ? makeResponses(queries) : makeResponse(req.body);
          res.json(response);
        } catch (err) {
          console.log(err?.message);
          res.json({});
        }
      });
    }

    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    return {
      app,
      server
    }
  }

  const killServer = () => {
    console.log(`Server shutting down on port ${port}`);
    process.exit();
  }

  return {
    startServer,
    killServer
  }
}