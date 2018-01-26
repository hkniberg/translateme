import {Session} from "meteor/session"

export function setTranslatedText(key, translatedText) {
  console.assert(key, "key is required")
  Session.set("translatedText-" + key, translatedText)
}

export function getTranslatedText(key) {
  console.assert(key, "key is required")
  return Session.get("translatedText-" + key)
}

