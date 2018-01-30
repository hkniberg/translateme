import {Session} from "meteor/session"



export function setLanguageData(owner, repo, languageCode, languageData) {
  console.assert(owner, "owner is required")
  console.assert(repo, "repo is required")
  console.assert(languageCode, "languageCode is required")
  console.assert(languageData, "languageData is required")

  Session.set("languageData-" + owner + "-" + repo + "-" + languageCode, languageData)
  if (Object.getOwnPropertyNames(languageData.texts).length > 0) {
    console.log("Saving languageData for " + languageCode)
    window.localStorage.setItem("languageData-" + owner + "-" + repo + "-" + languageCode, JSON.stringify(languageData))
  }
}

export function saveLanguageDataToLocalStorage(owner, repo, languageCode) {
  console.assert(owner, "owner is required")
  console.assert(repo, "repo is required")
  console.log("saveLanguageDataToLocalStorage", languageCode)
  window.localStorage.setItem("languageData-" + owner + "-" + repo + "-" + languageCode, JSON.stringify(getLanguageData(owner, repo, languageCode)))
}

export function loadLanguageDataFromLocalStorage(owner, repo, languageCode) {
  console.assert(owner, "owner is required")
  console.assert(repo, "repo is required")
  
  console.log("loadLanguageDataFromLocalStorage", languageCode)
  const savedLanguageData = window.localStorage.getItem("languageData-" + owner + "-" + repo + "-" + languageCode)
  if (savedLanguageData) {
    console.log("savedLanguageData", savedLanguageData)
    setLanguageData(owner, repo, languageCode, JSON.parse(savedLanguageData))
  }
}

export function getLanguageData(owner, repo, languageCode) {
  console.log("getLanguageData", languageCode)
  console.assert(owner, "owner is required")
  console.assert(repo, "repo is required")
  console.assert(languageCode, "languageCode is required")

  let languageData = Session.get("languageData-" + owner + "-" + repo + "-" + languageCode)
  if (!languageData) {
    console.log("Not found in session, will check in localstorage")
    loadLanguageDataFromLocalStorage(owner, repo, languageCode)
    languageData = Session.get("languageData-" + owner + "-" + repo + "-" + languageCode)
  }
  console.log("returning", languageData)
  return languageData
}

export function setLanguageText(owner, repo, languageCode, key, text) {
  console.assert(owner, "owner is required")
  console.assert(repo, "repo is required")
  console.assert(languageCode, "languageCode is required")
  console.assert(key, "key is required")

  const languageData = getLanguageData(owner, repo, languageCode)


  console.assert(languageData, "Hey, there is no languageData for " + languageCode)
  if (text == null || text == undefined || text.trim() == "") {
    delete languageData.texts[key]
  } else {
    languageData.texts[key] = text
  }
  setLanguageData(owner, repo, languageCode, languageData)
}

export function getLanguageText(owner, repo, languageCode, key) {
  console.log("getLanguageText", owner, repo, languageCode, key)
  console.assert(owner, "owner is required")
  console.assert(repo, "repo is required")
  console.assert(languageCode, "languageCode is required")
  console.assert(key, "key is required")

  const languageData = getLanguageData(owner, repo, languageCode)
  console.assert(languageData, "Hey, there is no languageData for " + languageCode)

  console.log("Returning " + languageData.texts[key])
  return languageData.texts[key]
}

