import {Session} from "meteor/session"
import {getLanguageName} from "../lib/data/languages";
import {getLanguageData} from "./translationStatus";
import {getPluginByName} from "../lib/initPlugins"
import {cacheGoogleTranslation} from "./googleTranslationCache";
import {getCachedGoogleTranslation} from "./googleTranslationCache";

Template.registerHelper('owner', function() {
  return Session.get("owner")
})

Template.registerHelper('repo', function() {
  return Session.get("repo")
})

Template.registerHelper('path', function() {
  return Session.get("path")
})

Template.registerHelper('loading', function() {
  return isLoading()
})

Template.registerHelper('error', function(context) {
  return getError(context)
})

Template.registerHelper('formatDateHowLongAgo', function(date) {
  return moment(date).fromNow()
})

export function isLoading() {
  return !!Session.get('loading')
}

export function setLoading(loading) {
  Session.set('loading', loading)
}

export function getError(context) {
  return Session.get("error " + context)
}

export function setError(context, description, err) {
  console.log("setError called", description, err)
  if (err) {
    if (err.reason) {
      Session.set("error " + context, description + "\n" + err.reason)
    } else {
      Session.set("error " + context, description + "\n" + err)
    }
  } else {
    Session.set("error " + context, description)
  }
}

export function clearError(context) {
  Session.set("error " + context, null)
}

/*
return {fileName: xxx, fileContent: yyy} (both strings)
 */
export function getLanguageFileData(owner, repo, languageCode) {
  const languageData = getLanguageData(owner, repo, languageCode)
  const plugin = getPluginByName(languageData.fileFormat)
  const fileName = plugin.getFileNameForLanguage(languageCode)
  return {
    fileName: fileName,
    fileContent: plugin.convertLanguageTextsToFileContents(fileName, languageData.texts)
  }
}

export function downloadLanguageFile(owner, repo, languageCode) {
  console.log("downloadLanguageFile", languageCode)

  const fileData = getLanguageFileData(owner, repo, languageCode)

  const href = 'data:application/json;charset=utf-8,'+ encodeURIComponent(fileData.fileContent);
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', href);
  linkElement.setAttribute('download', fileData.fileName);
  linkElement.click();
}

export function triggerGoogleTranslation(owner, repo, fromLanguageData, toLanguageCode) {
  console.assert(owner, "missing owner")
  console.assert(repo, "missing repo")
  console.assert(fromLanguageData, "missing fromLanguageData")
  console.assert(toLanguageCode, "missing toLanguageCode")
  
  const fromLanguageCode = fromLanguageData.languageCode
  const keys = Object.getOwnPropertyNames(fromLanguageData.texts)
  keys.forEach((key) => {
    const fromLanguageText = fromLanguageData.texts[key]
    if (!getCachedGoogleTranslation(owner, repo, key, fromLanguageCode, toLanguageCode)) {
      Meteor.call('googleTranslate', fromLanguageText, fromLanguageCode, toLanguageCode, function(err, translatedText) {
        if (err || !translatedText) {
          translatedText = ""
        }
        cacheGoogleTranslation(owner, repo, key, fromLanguageCode, toLanguageCode, translatedText)
      })
    }
  })
}

