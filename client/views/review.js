import {setError} from "../helpers";
import {getCachedGoogleTranslation} from "../googleTranslationCache";
import {triggerGoogleTranslationIfNeeded} from "../helpers";
import {getPluginByName} from "../../lib/initPlugins";
import {getGitHubAccessToken} from "../authentication";
import {session} from "../session"

const loadingVar = new ReactiveVar(true)
const repoNotFoundVar = new ReactiveVar(false)

const fromLanguageDataVar = new ReactiveVar(null)
const toLanguageDataVar = new ReactiveVar(null)

Template.review.onRendered(function() {
  const data = Template.currentData()
  console.assert(data.fromOwner, "missing fromOwner")
  console.assert(data.toOwner, "missing toOwner")
  console.assert(data.repo, "missing repo")
  console.assert(data.fromPath, "missing fromPath")
  console.assert(data.toPath, "missing toPath")
  console.assert(data.fileFormat, "missing fileFormat")
  console.log("review data", data)

  session.clearError("review")

  loadingVar.set(true)
  repoNotFoundVar.set(false)

  fromLanguageDataVar.set(null)
  toLanguageDataVar.set(null)

  console.log("Calling getReviewData")
  
  const params = {
    fromOwner: data.fromOwner,
    toOwner: data.toOwner,
    repo: data.repo,
    fromPath: data.fromPath,
    toPath: data.toPath,
    fileFormat: data.fileFormat,
    gitHubAccessToken: getGitHubAccessToken()
  }
  Meteor.call("getReviewData", params, function(err, languageDatas) {
    loadingVar.set(false)
    if (err) {
      if (err.error == "notFound") {
        repoNotFoundVar.set(true)
      } else {
        session.setError("review", "getReviewData failed", err)
      }
      return
    }
    console.log("Got", languageDatas)
    fromLanguageDataVar.set(languageDatas.fromLanguage)
    toLanguageDataVar.set(languageDatas.toLanguage)

    triggerGoogleTranslationIfNeeded(data.toOwner, data.repo, languageDatas.toLanguage, languageDatas.fromLanguage.languageCode)
  })
})

Template.review.helpers({
  languageCodesToLoad() {
    return [this.fromLanguageCode, this.toLanguageCode]
  },  
  
  loading() {
    return loadingVar.get()
  },

  sameOwner() {
    return this.fromOwner == this.toOwner
  },

  repo() {
    return Template.currentData().repo
  },
  
  repoNotFound() {
    return repoNotFoundVar.get()
  },

  fromLanguageCode() {
    return fromLanguageDataVar.get().languageCode
  },

  toLanguageCode() {
    return toLanguageDataVar.get().languageCode
  },

  fromLanguageName() {
    return fromLanguageDataVar.get().languageName
  },

  toLanguageName() {
    return toLanguageDataVar.get().languageName
  },


  dataSuccessfullyLoaded() {
    return !!fromLanguageDataVar.get()
  },

  textKeys() {
    const fromLanguageData = fromLanguageDataVar.get()
    return Object.getOwnPropertyNames(fromLanguageData.texts)
  },

  fromLanguageText() {
    const key = this
    const fromLanguageData = fromLanguageDataVar.get()
    return fromLanguageData.texts[key]
  },

  toLanguageText() {
    const key = this
    const toLanguageData = toLanguageDataVar.get()
    return toLanguageData.texts[key]
  },

  fromLanguageFileUrl() {
    const key = this
    const fromLanguageData = fromLanguageDataVar.get()
    return fromLanguageData.downloadUrl
  },

  toLanguageFileUrl() {
    const key = this
    const toLanguageData = toLanguageDataVar.get()
    return toLanguageData.downloadUrl
  },

  googleTranslationText() {
    const key = this
    const data = Template.parentData()
    const fromLanguageCode = fromLanguageDataVar.get().languageCode
    const toLanguageCode = toLanguageDataVar.get().languageCode
    return getCachedGoogleTranslation(data.toOwner, data.repo, key, toLanguageCode, fromLanguageCode)
  },

  /*
   {fileName: ...., fileContent: ....}
   */
  translationDoc() {
    const languageData = toLanguageDataVar.get()
    const plugin = getPluginByName(languageData.fileFormat)
    const fileName = plugin.getFileNameForLanguage(languageData.languageCode)
    return {
      fileName: fileName,
      fileContent: plugin.convertLanguageTextsToFileContents(fileName, languageData.texts)
    }
  }


})

