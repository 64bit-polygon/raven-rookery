import { Localizations } from "../Localizations/index.js";
import { createStartServer } from "../Server/index.js";

const initRookery = async ({
  token,
  projectIds,
  keepAlive,
  serverConfig
}) => {
  const Cache = new Localizations({token, projectIds, keepAlive});
  await Cache.init();

  const localize = (id, languages) => Cache.getLocalizations(id, languages);

  const { startServer, killServer } = createStartServer({
    ...serverConfig,
    getLocalizations: localize
  });

  let hasServerStarted;

  return {
    getLocalizations: localize,
    startServer: () => {
      if (hasServerStarted) {
        console.warn("WARNING: initRookery's startServer() can only be called once per instance");
        return;
      }
      hasServerStarted = true;
      startServer();
    },
    killServer: () => {
      hasServerStarted = false;
      killServer();
    }
  }
}

export { initRookery };