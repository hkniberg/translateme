import {Session} from "meteor/session"


export function getCachedGoogleTranslation(owner, repo, textKey, fromLanguageCode, toLanguageCode) {
  return Session.get("googleTranslation-" + owner + "-" + repo + "-" + textKey + "-" + fromLanguageCode + "-" + toLanguageCode)
}

export function cacheGoogleTranslation(owner, repo, textKey, fromLanguageCode, toLanguageCode, translatedText) {
  return Session.set("googleTranslation-" + owner + "-" + repo + "-" + textKey + "-" + fromLanguageCode + "-" + toLanguageCode, translatedText)
}
