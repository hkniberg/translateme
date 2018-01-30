import {Session} from "meteor/session"
import {setLoading} from "./../helpers";
import {setError} from "./../helpers";
import {clearError} from "./../helpers";
import {getAllLanguages} from "../../lib/data/languages";
import {getGitHubAccessToken} from "./../authentication";
import {signInToGitHub} from "./../gitHubClientUtil";
import {setLanguageData} from "./../translationStatus";
import {getCachedGoogleTranslation} from "./../googleTranslationCache";
import {cacheGoogleTranslation} from "./../googleTranslationCache";
import {loadLanguageDataFromLocalStorage} from "../translationStatus";

const languageInfosVar = new ReactiveVar()
const selectedLanguageCodeVar = new ReactiveVar()
const repoNotFoundVar = new ReactiveVar()
const parseErrorVar = new ReactiveVar()
const loadingTextsVar = new ReactiveVar(false)
const parseErrorLanguageInfoVar = new ReactiveVar(null)

Template.languages.onRendered(function() {
  setLoading(true)
  repoNotFoundVar.set(false)
  parseErrorVar.set(false)
  parseErrorLanguageInfoVar.set(null)
  clearError("languages")

  const data = Template.currentData()

  Meteor.call("getLanguageInfos", data.owner, data.repo, getGitHubAccessToken(), function(err, languageInfos) {
    setLoading(false)
    if (err) {
      console.log("Got error", err)
      if (err.error == "notFound") {
        repoNotFoundVar.set(true)
      } else {
        setError("languages", "getTranslationOverview failed", err)
      }
      return
    }

    languageInfosVar.set(languageInfos)
    
  })
})

Template.languages.helpers({
  loadingTexts() {
    return loadingTextsVar.get()
  },

  projectName() {
    return this.repo
  },

  projectLanguages() {
    return languageInfosVar.get()
  },

  projectLanguagesAsSentence() {
    const languages = languageInfosVar.get()
    const languageNames = languages.map((language) => {
      return language.languageName
    })
    let sentence = languageNames.join(', ')
    return sentence
  },
  
  allLanguagesExceptProjectLanguages() {
    const languages = getAllLanguages().filter((language) => {
      return !isProjectLanguageCode(language.languageCode)
    })
    return languages
  },

  hasMoreThanOneLanguage() {
    return languageInfosVar.get().length > 1
  },


  projectLanguagesExceptBase() {
    const projectLanguages = languageInfosVar.get()
    const baseLanguageCode = $(".updateFromLanguageCode").val()
    if (baseLanguageCode) {
      return languageInfosVar.get().filter((language) => {
        return language.languageCode != baseLanguageCode
      })
    } else {
      return projectLanguages
    }
  },

  buttonClass() {
    if (this.languageCode == selectedLanguageCodeVar.get()) {
      return "btn-success"
    } else {
      return "btn-default"
    }
  },

  repoNotFound() {
    return repoNotFoundVar.get()
  },
  
  parseError() {
    return parseErrorVar.get()
  },
  
  parseErrorLanguageInfo() {
    return parseErrorLanguageInfoVar.get()
  }
  
})

Template.languages.events({
  "click .createButton"() {

    createNewTranslation()


  },

  "click .gitHubSignInButton"() {
    signInToGitHub()


  }
})

function isProjectLanguageCode(languageCode) {
  return languageInfosVar.get().some((languageInfo) => {
    return languageCode == languageInfo.languageCode
  })
}

function getLanguageInfo(languageCode) {
  console.log("getLanguageInfo", languageCode, languageInfosVar.get())
  const result = languageInfosVar.get().find((languageInfo) => {
    return languageCode == languageInfo.languageCode
  })
  console.log("result", result)
  return result
}

function createNewTranslation() {
  const fromLanguageCode = $(".createFromLanguageCode").val()
  const toLanguageCode = $(".createToLanguageCode").val()
  const data = Template.currentData()

  loadingTextsVar.set(true)
  parseErrorVar.set(null)
  parseErrorLanguageInfoVar.set(null)
  
  clearError("languages", true)

  const fromLanguageInfo = getLanguageInfo(fromLanguageCode)

  Meteor.call("getLanguageDatas", data.owner, data.repo, fromLanguageInfo, toLanguageCode, getGitHubAccessToken(), function(err, languageDatas) {
    loadingTextsVar.set(false)
    if (err) {
      if (err.error == "parseError") {
        if (err.details) {
          parseErrorVar.set(err.details)
          parseErrorLanguageInfoVar.set(fromLanguageInfo)
        }
      } else {
        setError("languages", "getLanguageDatas failed", err)
      }
      return
    }
    setLanguageData(data.owner, data.repo, fromLanguageCode, languageDatas.fromLanguage)
    setLanguageData(data.owner, data.repo, toLanguageCode, languageDatas.toLanguage)
    if (Object.getOwnPropertyNames(languageDatas.toLanguage.texts).length == 0) {
      loadLanguageDataFromLocalStorage(data.owner, data.repo, toLanguageCode)
    }

    triggerGoogleTranslation(languageDatas.fromLanguage, toLanguageCode)

    Router.go('translate', {
      owner: data.owner,
      repo: data.repo,
      fromLanguageCode: fromLanguageCode,
      toLanguageCode: toLanguageCode
    })


  })


}

function triggerGoogleTranslation(fromLanguageData, toLanguageCode) {
  const fromLanguageCode = fromLanguageData.languageCode
  const keys = Object.getOwnPropertyNames(fromLanguageData.texts)
  keys.forEach((key) => {
    const fromLanguageText = fromLanguageData.texts[key]
    if (!getCachedGoogleTranslation(key, fromLanguageCode, toLanguageCode)) {
      Meteor.call('googleTranslate', fromLanguageText, fromLanguageCode, toLanguageCode, function(err, translatedText) {
        if (err) {
          translatedText = ""
        }
        cacheGoogleTranslation(key, fromLanguageCode, toLanguageCode, translatedText)
      })
    }
  })


}