export const EN_US = "en-us";
export const EN_GB = "en-gb";
export const SP_MX = "sp-mx";

export const KEY_1 = "KEY_1";
export const KEY_2 = "KEY_2";

export const VAL_1 = "value 1";
export const VAL_2 = "value 1";

export const SUFFIX_1 = "project 1";
export const SUFFIX_2 = "project 2";

export const PROJECT_ID_1 = "qwerty";
export const PROJECT_ID_2 = "zxcvbn";

export const makeVal = (baseValue, language, suffix) => `${baseValue} ${language} ${suffix}`;

export const LOCALIZATIONS = {
  [PROJECT_ID_1]: {
    [EN_US]: {
      [KEY_1]: makeVal(VAL_1, EN_US, SUFFIX_1),
      [KEY_2]: makeVal(VAL_2, EN_US, SUFFIX_1)
    },
    [EN_GB]: {
      [KEY_1]: makeVal(VAL_1, EN_GB, SUFFIX_1),
      [KEY_2]: makeVal(VAL_2, EN_GB, SUFFIX_1)
    },
    [SP_MX]: {
      [KEY_1]: makeVal(VAL_1, SP_MX, SUFFIX_1),
      [KEY_2]: makeVal(VAL_2, SP_MX, SUFFIX_1)
    }
  },
  [PROJECT_ID_2]: {
    [EN_US]: {
      [KEY_1]: makeVal(VAL_1, EN_US, SUFFIX_2),
      [KEY_2]: makeVal(VAL_2, EN_US, SUFFIX_2)
    },
    [SP_MX]: {
      [KEY_1]: makeVal(VAL_1, SP_MX, SUFFIX_2),
      [KEY_2]: makeVal(VAL_2, SP_MX, SUFFIX_2)
    }
  }
};

export const ID_TO_LANGUAGES_MAP = {
  [PROJECT_ID_1]: [EN_US, EN_GB, SP_MX],
  [PROJECT_ID_2]: [EN_US, SP_MX]
}
