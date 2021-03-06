import {Session} from "meteor/session"
import {getPluginByName} from "../lib/initPlugins"
import {cacheGoogleTranslation} from "./googleTranslationCache";
import {getCachedGoogleTranslation} from "./googleTranslationCache";
import {session} from "./session"
import {isSignedInToGitHub} from "./authentication";

Template.registerHelper('owner', function() {
  if (Template.currentData() && Template.currentData().owner) {
    return Template.currentData().owner
  } else {
    return session.getOwner()
  }
})

Template.registerHelper('repo', function() {
  if (Template.currentData() && Template.currentData().repo) {
    return Template.currentData().repo
  } else {
    return session.getRepo()
  }
})

Template.registerHelper('isSignedIn', function() {
  return isSignedInToGitHub()
})

Template.registerHelper('languageDatas', function() {
  const data = Template.currentData()
  return session.getLanguageDatas(data.owner, data.repo)
})

Template.registerHelper('showIntroVideo', function() {
  return Session.get("showIntroVideo")
})


Template.registerHelper('loading', function() {
  return isLoading()
})

Template.registerHelper('repoNotFound', function() {
  return session.isRepoNotFound()
})

Template.registerHelper('loadingLanguageData', function() {
  return session.isLoadingLanguageData()
})

Template.registerHelper('error', function(context) {
  return session.getError(context)
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


/*
return {fileName: xxx, fileContent: yyy} (both strings),
or null if fromLanguageData has not yet been loaded in the session
 */
export function getLanguageFileData(owner, repo, fromLanguageCode, toLanguageCode) {
  const mergedTexts = session.getMergedTexts(owner, repo, fromLanguageCode, toLanguageCode)

  const fromLanguageData = session.getLanguageData(owner, repo, fromLanguageCode)
  if (fromLanguageData) {
    const plugin = getPluginByName(fromLanguageData.fileFormat)
    const fileName = plugin.getFileNameForLanguage(toLanguageCode)
    return {
      fileName: fileName,
      fileContent: plugin.convertLanguageTextsToFileContents(fileName, mergedTexts)
    }
  } else {
    return null
  }

}

export function downloadLanguageFile(owner, repo, fromLanguageCode, toLanguageCode) {
  check(owner, String)
  check(repo, String)
  check(fromLanguageCode, String)
  check(toLanguageCode, String)

  const fileData = getLanguageFileData(owner, repo, fromLanguageCode, toLanguageCode)

  const href = 'data:application/json;charset=utf-8,'+ encodeURIComponent(fileData.fileContent);
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', href);
  linkElement.setAttribute('download', fileData.fileName);
  linkElement.click();
}

export function triggerGoogleTranslationIfNeeded(owner, repo, fromLanguageData, toLanguageCode) {
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

