import request from "supertest";
import { Localizations } from "../Localizations/index.js";
import { createStartServer } from "../Server/index.js";
import {
  LOCALIZATIONS,
  ID_TO_LANGUAGES_MAP,
  PROJECT_ID_1,
  PROJECT_ID_2,
  EN_US,
  SP_MX
} from "./fixtures/localizations.js";

const Cache = new Localizations({ token: "a", projectIds: [PROJECT_ID_1, PROJECT_ID_2] });
Cache.idToLanguagesMap = ID_TO_LANGUAGES_MAP;
Cache.localizations = LOCALIZATIONS;
const localize = (id, language) => Cache.getLocalizations(id, language);

/**
 * note: "2-D object" refers to an object with keys as languages the hold localizations:
 * {
 *   "en-us": {
 *     KEY: "value"
 *   }
 * }
 * 
 * "3-D object" will include the project ID:
 * {
 *   "my-project-id": {
 *     "en-us": {
 *       KEY: "value"
 *     }
 *   }
 * }
 */

describe("Server: GET projects", () => {  
  it("should return one project with all languages in a 2-D object w/ a GET req", async () => {
    const { startServer } = createStartServer({
      getLocalizations: localize
    });
    const { app, server } = startServer();
    const url = `/localizations?data={"projectId":"${PROJECT_ID_1}"}`;
    const response = await request(app).get(url);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(LOCALIZATIONS[PROJECT_ID_1]);
    server.close();
  });

  it("should return one project with all languages in a 3-D object w/ a GET req", async () => {
    const { startServer } = createStartServer({
      getLocalizations: localize
    });
    const { app, server } = startServer();
    const url = `/localizations?data=[{"projectId":"${PROJECT_ID_1}"}]`;
    const response = await request(app).get(url);
    expect(response.status).toBe(200);
    const result = {
      [PROJECT_ID_1]: { ...LOCALIZATIONS[PROJECT_ID_1] },
    }
    expect(response.body).toStrictEqual(result);
    server.close();
  });

  it("should return one project with specific languages in a 2-D object w/ a GET req", async () => {
    const { startServer } = createStartServer({
      getLocalizations: localize
    });
    const { app, server } = startServer();
    const url = `/localizations?data={"projectId":"${PROJECT_ID_1}", "languages": ["${EN_US}", "${SP_MX}"]}`;
    const response = await request(app).get(url);
    expect(response.status).toBe(200);
    const result = {
      [EN_US]: { ...LOCALIZATIONS[PROJECT_ID_1][EN_US] },
      [SP_MX]: { ...LOCALIZATIONS[PROJECT_ID_1][SP_MX] }
    }
    expect(response.body).toStrictEqual(result);
    server.close();
  });

  it("should return one project with specific languages in a 3-D object w/ a GET req", async () => {
    const { startServer } = createStartServer({
      getLocalizations: localize
    });
    const { app, server } = startServer();
    const url = `/localizations?data=[{"projectId":"${PROJECT_ID_1}", "languages": ["${EN_US}", "${SP_MX}"]}]`;
    const response = await request(app).get(url);
    expect(response.status).toBe(200);
    const result = {
      [PROJECT_ID_1]: {
        [EN_US]: { ...LOCALIZATIONS[PROJECT_ID_1][EN_US] },
        [SP_MX]: { ...LOCALIZATIONS[PROJECT_ID_1][SP_MX] }
      }
    }
    expect(response.body).toStrictEqual(result);
    server.close();
  });

  it("should return multiple project with specific languages and all languages w/ a GET req", async () => {
    const { startServer } = createStartServer({
      getLocalizations: localize
    });
    const { app, server } = startServer();
    const project1Query = `{"projectId":"${PROJECT_ID_1}", "languages": ["${EN_US}"]}`;
    const project2Query = `{"projectId":"${PROJECT_ID_2}"}`;
    const url = `/localizations?data=[${project1Query}, ${project2Query}]`;
    const response = await request(app).get(url);
    expect(response.status).toBe(200);
    const result = {
      [PROJECT_ID_1]: {
        [EN_US]: { ...LOCALIZATIONS[PROJECT_ID_1][EN_US] }
      },
      [PROJECT_ID_2]: {
        ...LOCALIZATIONS[PROJECT_ID_2]
      }
    }
    expect(response.body).toStrictEqual(result);
    server.close();
  });

  it("should return multiple project with specific languages and all languages while customizing the endpoint, languagesKey, projectIdKey, and dataKey w/ a GET req", async () => {
    const endpoint = "some/long/custom/endpoint";
    const languagesKey = "lang";
    const projectIdKey = "proj";
    const dataKey = "req";
    const { startServer } = createStartServer({
      getLocalizations: localize,
      endpoint,
      languagesKey,
      projectIdKey,
      dataKey
    });
    const { app, server } = startServer();
    const project1Query = `{"${projectIdKey}":"${PROJECT_ID_1}", "${languagesKey}": ["${EN_US}"]}`;
    const project2Query = `{"${projectIdKey}":"${PROJECT_ID_2}"}`;
    const url = `/${endpoint}?${dataKey}=[${project1Query}, ${project2Query}]`;
    const response = await request(app).get(url);
    expect(response.status).toBe(200);
    const result = {
      [PROJECT_ID_1]: {
        [EN_US]: { ...LOCALIZATIONS[PROJECT_ID_1][EN_US] }
      },
      [PROJECT_ID_2]: {
        ...LOCALIZATIONS[PROJECT_ID_2]
      }
    }
    expect(response.body).toStrictEqual(result);
    server.close();
  })
});

describe("Server: POST projects", () => {
  const url = "/localizations";

  it("should return one project with all languages in a 2-D object w/ a POST req", async () => {
    const { startServer } = createStartServer({
      getLocalizations: localize,
      requestType: "POST"
    });
    const { app, server } = startServer();
    const options = {
      projectId: PROJECT_ID_1
    };
    const response = await request(app).post(url).send(options);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(LOCALIZATIONS[PROJECT_ID_1]);
    server.close();
  });

  it("should return one project with all languages in a 3-D object w/ a POST req", async () => {
    const { startServer } = createStartServer({
      getLocalizations: localize,
      requestType: "POST"
    });
    const { app, server } = startServer();
    const options = {
      data: [
        { projectId: PROJECT_ID_1 }
      ]
    };
    const response = await request(app).post(url).send(options);
    expect(response.status).toBe(200);
    const result = {
      [PROJECT_ID_1]: { ...LOCALIZATIONS[PROJECT_ID_1] },
    }
    expect(response.body).toStrictEqual(result);
    server.close();
  });

  it("should return one project with specific languages in a 2-D object w/ a POST req", async () => {
    const { startServer } = createStartServer({
      getLocalizations: localize,
      requestType: "POST"
    });
    const { app, server } = startServer();
    const options = {
      projectId: PROJECT_ID_1,
      languages: [EN_US, SP_MX]
    };
    const response = await request(app).post(url).send(options);
    expect(response.status).toBe(200);
    const result = {
      [EN_US]: { ...LOCALIZATIONS[PROJECT_ID_1][EN_US] },
      [SP_MX]: { ...LOCALIZATIONS[PROJECT_ID_1][SP_MX] }
    }
    expect(response.body).toStrictEqual(result);
    server.close();
  });

  it("should return one project with specific languages in a 3-D object w/ a POST req", async () => {
    const { startServer } = createStartServer({
      getLocalizations: localize,
      requestType: "POST"
    });
    const { app, server } = startServer();
    const options = {
      data: [
        {
          projectId: PROJECT_ID_1,
          languages: [EN_US, SP_MX]
        }
      ]
    };
    const response = await request(app).post(url).send(options);
    expect(response.status).toBe(200);
    const result = {
      [PROJECT_ID_1]: {
        [EN_US]: { ...LOCALIZATIONS[PROJECT_ID_1][EN_US] },
        [SP_MX]: { ...LOCALIZATIONS[PROJECT_ID_1][SP_MX] }
      }
    }
    expect(response.body).toStrictEqual(result);
    server.close();
  });

  it("should return multiple project with specific languages and all languages w/ a POST req", async () => {
    const { startServer } = createStartServer({
      getLocalizations: localize,
      requestType: "POST"
    });
    const { app, server } = startServer();
    const options = {
      data: [
        {
          projectId: PROJECT_ID_1,
          languages: [EN_US]
        },
        { projectId: PROJECT_ID_2 }
      ]
    };
    const response = await request(app).post(url).send(options);
    expect(response.status).toBe(200);
    const result = {
      [PROJECT_ID_1]: {
        [EN_US]: { ...LOCALIZATIONS[PROJECT_ID_1][EN_US] }
      },
      [PROJECT_ID_2]: {
        ...LOCALIZATIONS[PROJECT_ID_2]
      }
    }
    expect(response.body).toStrictEqual(result);
    server.close();
  });

  it("should return multiple project with specific languages and all languages while customizing the endpoint, languagesKey, projectIdKey, and dataKey w/ a POST req", async () => {
    const endpoint = "some/long/custom/endpoint";
    const languagesKey = "lang";
    const projectIdKey = "proj";
    const dataKey = "req";
    const { startServer } = createStartServer({
      getLocalizations: localize,
      endpoint,
      languagesKey,
      projectIdKey,
      dataKey,
      requestType: "POST"
    });
    const { app, server } = startServer();
    const options = {
      [dataKey]: [
        {
          [projectIdKey]: PROJECT_ID_1,
          [languagesKey]: [EN_US]
        },
        { [projectIdKey]: PROJECT_ID_2 }
      ]
    };
    const response = await request(app).post(`/${endpoint}`).send(options);
    expect(response.status).toBe(200);
    const result = {
      [PROJECT_ID_1]: {
        [EN_US]: { ...LOCALIZATIONS[PROJECT_ID_1][EN_US] }
      },
      [PROJECT_ID_2]: {
        ...LOCALIZATIONS[PROJECT_ID_2]
      }
    }
    expect(response.body).toStrictEqual(result);
    server.close();
  })
});
