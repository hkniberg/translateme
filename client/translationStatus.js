import {Session} from "meteor/session"

export function setTranslatedText(key, translatedText) {
  console.assert(key, "key is required")
  Session.set("translatedText-" + key, translatedText)
}

export function getTranslatedText(key) {
  console.assert(key, "key is required")
  return Session.get("translatedText-" + key)
}


export function setFullTranslation(fullTranslation) {
  console.assert(fullTranslation, "fullTranslation is required")
  Session.set("fullTranslation", fullTranslation)
}

export function getFullTranslation() {
  return Session.get("fullTranslation")
}
