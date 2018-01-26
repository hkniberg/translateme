import {Session} from "meteor/session"

export function getCachedGoogleTranslation(textKey, fromLanguageCode, toLanguageCode) {
  return Session.get("googleTranslation-" + textKey + "-" + fromLanguageCode + "-" + toLanguageCode)
}

export function cacheGoogleTranslation(textKey, fromLanguageCode, toLanguageCode, translatedText) {
  return Session.set("googleTranslation-" + textKey + "-" + fromLanguageCode + "-" + toLanguageCode, translatedText)
}
