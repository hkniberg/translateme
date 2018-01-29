import {Session} from "meteor/session"
import {setLoading} from "./helpers";
import {setError} from "./helpers";
import {clearError} from "./helpers";
import {getAllLanguages} from "../lib/data/languages";
import {getGitHubAccessToken} from "./authentication";
import {signInToGitHub} from "./gitHubClientUtil";
import {setLanguageData} from "./translationStatus";
import {getCachedGoogleTranslation} from "./googleTranslationCache";
import {cacheGoogleTranslation} from "./googleTranslationCache";

const projectLanguagesVar = new ReactiveVar()
const selectedLanguageCodeVar = new ReactiveVar()
const isGitHubErrorVar = new ReactiveVar()
const loadingTextsVar = new ReactiveVar(false)

Template.languages.onRendered(function() {
  setLoading(true)
  isGitHubErrorVar.set(false)
  clearError("languages")

  const data = Template.currentData()

  console.log("calling getLanguages with gitHubAccessToken", getGitHubAccessToken())
  Meteor.call("getLanguageInfos", data.owner, data.repo, getGitHubAccessToken(), function(err, languages) {
    setLoading(false)
    if (err) {
      if (err.error = "gitHubError") {
        isGitHubErrorVar.set(true)
      } else {
        setError("languages", "getTranslationOverview failed", err)
      }
      return
    }
    console.log("Got languages", languages)
    projectLanguagesVar.set(languages)
    
  })
})

Template.languages.helpers({
  loadingTexts() {
    return loadingTextsVar.get()
  },


  projectLanguages() {
    return projectLanguagesVar.get()
  },

  projectLanguagesAsSentence() {
    const languages = projectLanguagesVar.get()
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
    return projectLanguagesVar.get().length > 1
  },


  projectLanguagesExceptBase() {
    console.log("projectLanguagesExceptBase")
    const projectLanguages = projectLanguagesVar.get()
    const baseLanguageCode = $(".updateFromLanguageCode").val()
    console.log("baseLanguageCode", baseLanguageCode)
    if (baseLanguageCode) {
      return projectLanguagesVar.get().filter((language) => {
        console.log("Comparing " + language.languageCode + " with " + baseLanguageCode)
        return language.languageCode != baseLanguageCode
      })
    } else {
      console.log("no base")
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

  gitHubError() {
    return isGitHubErrorVar.get()
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
  return projectLanguagesVar.get().some((language) => {
    return languageCode == language.languageCode
  })
}

function createNewTranslation() {
  const fromLanguageCode = $(".createFromLanguageCode").val()
  const toLanguageCode = $(".createToLanguageCode").val()
  const data = Template.currentData()

  loadingTextsVar.set(true)
  clearError("languages", true)

  console.log("Calling getLanguageDatas")

  Meteor.call("getLanguageDatas", data.owner, data.repo, fromLanguageCode, toLanguageCode, getGitHubAccessToken(), function(err, languageDatas) {
    console.log("getLanguageDatas done", err, languageDatas)
    if (err) {
      setError("languages", "getLanguageDatas failed", err)
      return
    }
    setLanguageData(fromLanguageCode, languageDatas.fromLanguage)
    setLanguageData(toLanguageCode, languageDatas.toLanguage)

    loadingTextsVar.set(false)

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