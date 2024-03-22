import fetch from "cross-fetch";

export const TOKEN_ERROR_MESSAGE = "token parameter is missing or malformed";
export const PROJECT_IDS_ERROR_MESSAGE = "projectIds parameter is missing or malformed";
export const KEEP_ALIVE_ERROR_MESSAGE = "keepAlive parameter must be a number or undefined";
export const DEFAULT_KEEP_ALIVE = 1000 * 1000 * 60 * 10;

const removeDuplicates = arr => [...new Set(arr)];

export class Localizations {
  api_token;
  projectIds;
  localizations = {};
  keepAlive;
  idToLanguagesMap = {};
  
  constructor({token, projectIds, keepAlive}) {
    const isMissingToken = !token || typeof token !== "string";
    if (isMissingToken) throw new TypeError(TOKEN_ERROR_MESSAGE);

    const isProjectIdsMalformed = !projectIds || !projectIds.length || !Array.isArray(projectIds);
    if (isProjectIdsMalformed) {
      throw new TypeError(PROJECT_IDS_ERROR_MESSAGE);
    }

    const isKeepAliveMalformed = keepAlive && (typeof keepAlive !== "number");
    if (isKeepAliveMalformed) {
      throw new TypeError(KEEP_ALIVE_ERROR_MESSAGE);
    }

    this.api_token = token;
    this.projectIds = projectIds;
    this.keepAlive = keepAlive ? keepAlive : DEFAULT_KEEP_ALIVE;
  }

  async init() {
    let languages;

    try {
      languages = await this.getLanguages();

    } catch (err) {
      console.log(err);
      return;
    }

    this.idToLanguagesMap = this.makeIdToLanguagesMap(languages, this.projectIds);
    await this.fetchLocalizations();
  }

  async getLanguages() {
    const fetchOptions = this.projectIds.map(id => ({
      method: "POST",
      body: new URLSearchParams({id, api_token: this.api_token})
    }));

    let responses = fetchOptions.map(options => fetch("https://api.poeditor.com/v2/languages/list", options));
    responses = await Promise.all(responses);

    let parsedResponses = responses.map(response => response.json());
    parsedResponses = await Promise.all(parsedResponses);

    parsedResponses.forEach((response, index) => {
      if (response.response.status !== "success") {
        throw new Error(`${response.response.message}. On project id: ${this.projectIds[index]}.`)
      }
    });

    return parsedResponses;
  }

  makeIdToLanguagesMap(languages, projectIds) {
    return projectIds.reduce((idMap, id, index) => ({
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

  getLocalizations(id, languages) {
    if (!id || !this.idToLanguagesMap[id]) return {};
    if (!languages || !Array.isArray(languages) || !languages.length ) return this.localizations[id];

    languages = removeDuplicates(languages);

    return languages.reduce((localizations, language) => ({
      ...localizations,
      [language]: this.localizations[id]?.[language] ?? {}
    }), {});
  }

  getLocalizationsByLang(id, language) {
    if (!id || !this.idToLanguagesMap[id]) return {};
    if (!language || typeof language !== "string" ) return {};

    return this.localizations[id][language] ?? {};
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