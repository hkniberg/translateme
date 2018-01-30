import {Session} from "meteor/session"



export function setLanguageData(languageCode, languageData) {
  console.assert(languageCode, "languageCode is required")
  console.assert(languageData, "languageData is required")

  Session.set("languageData-" + languageCode, languageData)
}

export function saveLanguageDataToLocalStorage(languageCode) {
  console.log("saveLanguageDataToLocalStorage", languageCode)
  window.localStorage.setItem("languageData-" + languageCode, JSON.stringify(getLanguageData(languageCode)))
}

export function loadLanguageDataFromLocalStorage(languageCode) {
  console.log("loadLanguageDataFromLocalStorage", languageCode)
  const savedLanguageData = window.localStorage.getItem("languageData-" + languageCode)
  console.log("savedLanguageData", savedLanguageData)
  setLanguageData(languageCode, JSON.parse(savedLanguageData))
}

export function getLanguageData(languageCode) {
  console.assert(languageCode, "languageCode is required")

  const languageData = Session.get("languageData-" + languageCode)
  if (!languageData) {
    loadLanguageDataFromLocalStorage(languageCode)
    Session.get("languageData-" + languageCode)
  } else {
    return languageData
  }
}

export function setLanguageText(languageCode, key, text) {
  console.assert(languageCode, "languageCode is required")
  console.assert(key, "key is required")

  const languageData = getLanguageData(languageCode)


  console.assert(languageData, "Hey, there is no languageData for " + languageCode)
  if (text == null || text == undefined || text.trim() == "") {
    delete languageData.texts[key]
  } else {
    languageData.texts[key] = text
  }
  setLanguageData(languageCode, languageData)
}

export function getLanguageText(languageCode, key) {
  console.assert(languageCode, "languageCode is required")
  console.assert(key, "key is required")

  const languageData = getLanguageData(languageCode)
  console.assert(languageData, "Hey, there is no languageData for " + languageCode)

  return languageData.texts[key]
}

export function getLanguageFileContents(languageCode, key) {
  
}
