import {Session} from "meteor/session"

export function setLanguageData(languageCode, languageData) {
  console.log("setLanguageData", languageCode, languageData)
  console.assert(languageCode, "languageCode is required")
  console.assert(languageData, "languageData is required")

  Session.set("languageData-" + languageCode, languageData)
}

export function getLanguageData(languageCode) {
  console.assert(languageCode, "languageCode is required")

  return Session.get("languageData-" + languageCode)
}

export function setLanguageText(languageCode, key, text) {
  console.log("setLanguageText", languageCode, key, text)
  console.assert(languageCode, "languageCode is required")
  console.assert(key, "key is required")

  const languageData = getLanguageData(languageCode)
  console.assert(languageData, "Hey, there is no languageData for " + languageCode)
  languageData.texts[key] = text
  setLanguageData(languageCode, languageData)
}

export function getLanguageText(languageCode, key) {
  console.assert(languageCode, "languageCode is required")
  console.assert(key, "key is required")

  const languageData = getLanguageData(languageCode)
  console.assert(languageData, "Hey, there is no languageData for " + languageCode)

  console.log("getLanguageText", languageCode, key, "Result: ", languageData.texts[key])
  return languageData.texts[key]
}
