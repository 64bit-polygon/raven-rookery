it("Localizations", () => {
  expect(true).toBe(true)
});

import {
  Localizations,
  TOKEN_ERROR_MESSAGE,
  PROJECT_IDS_ERROR_MESSAGE,
  KEEP_ALIVE_ERROR_MESSAGE,
  DEFAULT_KEEP_ALIVE
} from "./index.js";

import {
  PROJECT_ID_1,
  PROJECT_ID_2,
  PROJECT_ID_1_LANGUAGES_RES,
  PROJECT_ID_2_LANGUAGES_RES
} from "./fixtures/languages.js";

import {
  KEY_1,
  KEY_2,
  US_VAL_1,
  US_VAL_2,
  MX_VAL_1,
  MX_VAL_2,
  TRANSLATIONS
} from "./fixtures/translations.js";

describe("Localizations", () => {
  it("should make the Cache instance", () => {
    const token = "1234";
    const projectIds = ["qwerty"];
    const keepAlive = 1000;
    const Cache = new Localizations({token, projectIds, keepAlive});
    expect(Cache.api_token).toBe(token);
    expect(Cache.projectIds).toBe(projectIds);
    expect(Cache.keepAlive).toBe(keepAlive);
    expect(Cache.localizations).toStrictEqual({});
    expect(Cache.idToLanguagesMap).toStrictEqual({});
  });

  it("keepAlive should set to a default value if falsey", () => {
    const params = { token: "a", projectIds: ["a"] }
    const Cache1 = new Localizations({...params});
    expect(Cache1.keepAlive).toBe(DEFAULT_KEEP_ALIVE);
    const Cache2 = new Localizations({...params, keepAlive: false});
    expect(Cache1.keepAlive).toBe(DEFAULT_KEEP_ALIVE);
    const Cache3 = new Localizations({...params, keepAlive: null});
    expect(Cache3.keepAlive).toBe(DEFAULT_KEEP_ALIVE);
  });

  it("should throw an error if the token param is missing in new Localizations({...})", () => {
    const projectIds = ["a"];
    expect(() => new Localizations({token: undefined, projectIds})).toThrow(TOKEN_ERROR_MESSAGE);
    expect(() => new Localizations({token: null, projectIds})).toThrow(TOKEN_ERROR_MESSAGE);
    expect(() => new Localizations({token: 1, projectIds})).toThrow(TOKEN_ERROR_MESSAGE);
    expect(() => new Localizations({token: "", projectIds})).toThrow(TOKEN_ERROR_MESSAGE);
  });

  it("should throw an error if the projectIds param is missing in new Localizations({...})", () => {
    const token = "a";
    expect(() => new Localizations({token, projectIds: undefined})).toThrow(PROJECT_IDS_ERROR_MESSAGE);
    expect(() => new Localizations({token, projectIds: null})).toThrow(PROJECT_IDS_ERROR_MESSAGE);
    expect(() => new Localizations({token, projectIds: []})).toThrow(PROJECT_IDS_ERROR_MESSAGE);
    expect(() => new Localizations({token, projectIds: {}})).toThrow(PROJECT_IDS_ERROR_MESSAGE);
    expect(() => new Localizations({token, projectIds: "a"})).toThrow(PROJECT_IDS_ERROR_MESSAGE);
  });

  it("should throw an error if keepAlive is malformed in new Localizations({...})", () => {
    const params = { token: "a", projectIds: ["a"] }
    expect(() => new Localizations({...params, keepAlive: "a"})).toThrow(KEEP_ALIVE_ERROR_MESSAGE);
    expect(() => new Localizations({...params, keepAlive: true})).toThrow(KEEP_ALIVE_ERROR_MESSAGE);
    expect(() => new Localizations({...params, keepAlive: {}})).toThrow(KEEP_ALIVE_ERROR_MESSAGE);
    expect(() => new Localizations({...params, keepAlive: []})).toThrow(KEEP_ALIVE_ERROR_MESSAGE);
  });

  it("should make the id to languages map", () => {
    const projectIds = [PROJECT_ID_1, PROJECT_ID_2];
    const Cache = new Localizations({ token: "a", projectIds });
    const idToLanguagesMap = Cache.makeIdToLanguagesMap([PROJECT_ID_1_LANGUAGES_RES, PROJECT_ID_2_LANGUAGES_RES], projectIds);
    const result = {
      [PROJECT_ID_1]: [
        PROJECT_ID_1_LANGUAGES_RES.result.languages[0].code,
        PROJECT_ID_1_LANGUAGES_RES.result.languages[1].code,
        PROJECT_ID_1_LANGUAGES_RES.result.languages[2].code
      ],
      [PROJECT_ID_2]: [
        PROJECT_ID_2_LANGUAGES_RES.result.languages[0].code
      ]
    }

    expect(idToLanguagesMap).toStrictEqual(result);
  });

  it("should normalize response data", () => {
    const enUS = "en-us";
    const spMX = "sp-mx";
    const languages = [enUS, spMX];
    const Cache = new Localizations({ token: "a", projectIds: ["a"] });
    const normalizedData = Cache.normalizeResponseData(TRANSLATIONS, languages);
    expect(normalizedData[enUS][KEY_1]).toBe(US_VAL_1);
    expect(normalizedData[enUS][KEY_2]).toBe(US_VAL_2);
    expect(normalizedData[spMX][KEY_1]).toBe(MX_VAL_1);
    expect(normalizedData[spMX][KEY_2]).toBe(MX_VAL_2);
  });

  it("should return localizations with getLocalizations()", () => {
    const Cache = new Localizations({ token: "a", projectIds: ["a"] });
    const projectId = "qwerty";
    const nonPresentProjectId = "zxcvbn";
    const enUS = "en-us";
    const languageLocalization = {
      KEY_1: "value 1"
    };

    const localizations = {
      [projectId]: {
        [enUS]: {...languageLocalization}
      }
    }

    Cache.localizations = localizations;
    Cache.idToLanguagesMap = {[projectId]: [enUS]};

    expect(Cache.getLocalizations(projectId)).toStrictEqual(Cache.localizations[projectId]);
    expect(Cache.getLocalizations(projectId, [enUS])).toStrictEqual({
      [enUS]: Cache.localizations[projectId][enUS]
    });
    expect(Cache.getLocalizations(projectId, [enUS, enUS, enUS])).toStrictEqual({
      [enUS]: Cache.localizations[projectId][enUS]
    });
    expect(Cache.getLocalizations(projectId, ["sp-mx"])).toStrictEqual({"sp-mx": {}});
    expect(Cache.getLocalizations(nonPresentProjectId)).toStrictEqual({});
    expect(Cache.getLocalizations(nonPresentProjectId, [enUS])).toStrictEqual({});
  });

  it("should return localization with getLocalizationsByLang()", () => {
    const Cache = new Localizations({ token: "a", projectIds: ["a"] });
    const projectId = "qwerty";
    const nonPresentProjectId = "zxcvbn";
    const enUS = "en-us";
    const languageLocalization = {
      KEY_1: "value 1"
    };

    const localizations = {
      [projectId]: {
        [enUS]: {...languageLocalization}
      }
    }

    Cache.localizations = localizations;
    Cache.idToLanguagesMap = {[projectId]: [enUS]};

    expect(Cache.getLocalizationsByLang(projectId, enUS)).toStrictEqual(Cache.localizations[projectId][enUS]);
    expect(Cache.getLocalizationsByLang(projectId)).toStrictEqual({});
    expect(Cache.getLocalizationsByLang(projectId, "sp-mx")).toStrictEqual({});
    expect(Cache.getLocalizationsByLang(nonPresentProjectId, enUS)).toStrictEqual({});
    expect(Cache.getLocalizationsByLang(nonPresentProjectId, [enUS])).toStrictEqual({});
  });

  it("should set localizations", () => {
    const Cache = new Localizations({ token: "a", projectIds: ["a"] });
    const projectId = "qwerty";
    const enUS = "en-us";
    const localizations = {
      [enUS]: {
        KEY_1: "value 1"
      }
    };
    Cache.setLocalizations(projectId, localizations);
    expect(Cache.localizations).toStrictEqual({[projectId]: localizations});
  })
});
