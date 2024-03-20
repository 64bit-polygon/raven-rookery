import fetch from "cross-fetch";

export const TOKEN_ERROR_MESSAGE = "An api token is required";
export const PROJECT_IDS_ERROR_MESSAGE = "projectIds parameter is missing or malformed";

export class Localizations {
  api_token;
  projectIds;
  localizations = {};
  keepAlive;
  idToLanguagesMap;
  
  constructor({token, projectIds, keepAlive}) {
    const isMissingToken = !token || typeof token !== "string";
    if (isMissingToken) throw new TypeError(TOKEN_ERROR_MESSAGE);
    if (!projectIds || !projectIds.length || !Array.isArray(projectIds)) {
      throw new TypeError(PROJECT_IDS_ERROR_MESSAGE);
    }

    this.api_token = token;
    this.projectIds = projectIds;
    const tenMins = 1000 * 1000 * 60 * 10;
    this.keepAlive = keepAlive ? keepAlive : tenMins;
  }

  async init() {
    const languages = await this.getLanguages();
    this.idToLanguagesMap = this.makeIdToLanguagesMap(languages);
    await this.fetchLocalizations();
  }

  async getLanguages() {
    const fetchOptions = this.projectIds.map(id => ({
      method: "POST",
      body: new URLSearchParams({id, api_token: this.api_token})
    }));

    let responses = fetchOptions.map(options => fetch("https://api.poeditor.com/v2/languages/list", options));
    responses = await Promise.all(responses);

    let languages = responses.map(response => response.json());
    languages = await Promise.all(languages);

    return languages;
  }

  makeIdToLanguagesMap(languages) {
    return this.projectIds.reduce((idMap, id, index) => ({
      ...idMap,
      [id]: languages[index].result.languages.map(language => language.code)
    }), {});
  }

  setLocalizations(id, localizations) {
    this.localizations[id] = localizations;
  }

  async fetchLocalization(id) {
    const languages = this.idToLanguagesMap[id];
    const fetchOptions = languages.map(language => ({
      method: "POST",
      body: new URLSearchParams({id, api_token: this.api_token, language})
    }));

    try {
      let responses = fetchOptions.map(options => fetch("https://api.poeditor.com/v2/terms/list", options));
      responses = await Promise.all(responses);
  
      let rawLocalizations = responses.map(response => response.json());
      rawLocalizations = await Promise.all(rawLocalizations);

      const localizations = this.normalizeResponseData(rawLocalizations, languages);
      this.setLocalizations(id, localizations);

    } catch (err) {
      console.log(`could not cache localizations for POEditor with project id ${id}`, err);
    }
  }

  async fetchLocalizations() {
    const responses = this.projectIds.map(id => this.fetchLocalization(id));
    await Promise.all(responses);

    setTimeout(() => {
      this.fetchLocalizations();
    }, this.keepAlive)
  }

  getLocalizations(id, language) {
    if (!id || !this.idToLanguagesMap[id]) return {};
    if (!language) return this.localizations[id];
    return this.localizations[id]?.[language] ?? {};
  }

  normalizeResponseData(responseData, languages) {
    return languages.reduce((result, language, i) => {
      const normalizedData = Object.values(responseData[i].result.terms).reduce((keyValMap, term) => ({
        ...keyValMap,
        [term.term]: term.translation.content
      }), {});

      return {
        ...result,
        [language]: normalizedData
      }
    }, {});
  }
};