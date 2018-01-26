import {setLoading} from "./helpers"
import {clearError} from "./helpers"
import {setError} from "./helpers";
import {getLanguageName} from "../lib/data/languages";
import {getCachedGoogleTranslation} from "./googleTranslationCache";
import {cacheGoogleTranslation} from "./googleTranslationCache";
import {setTranslatedText} from "./translationStatus";
import {getTranslatedText} from "./translationStatus";
import {getGitHubAccessToken} from "./authentication";
import {setFullTranslation} from "./translationStatus";

const languageTextsVar = new ReactiveVar()

/*
Expected data context:
  - owner
  - repo
  - fromLanguageFile
  - fromLanguageCode
  - toLanguageCode
 */
Template.translate.onRendered(function() {
  const data = Template.currentData()
  console.assert(data.owner, "owner missing")
  console.assert(data.repo, "repo missing")
  console.assert(data.fromLanguageCode, "fromLanguageCode missing")
  console.assert(data.toLanguageCode, "toLanguageCode missing")

  setLoading(true)
  clearError("translate", true)


  Meteor.call("getLanguageTexts", data.owner, data.repo, data.fromLanguageCode, getGitHubAccessToken(), function(err, languageTexts) {
    setLoading(false)
    if (err) {
      setError("translate", "getLanguageTexts failed", err)
      return
    }
    languageTextsVar.set(languageTexts)

    languageTexts.forEach((languageText) => {
      Meteor.call('googleTranslate', languageText.text, data.fromLanguageCode, data.toLanguageCode, function(err, translatedText) {
        if (err) {
          translatedText = ""
        }
        cacheGoogleTranslation(languageText.key, data.fromLanguageCode, data.toLanguageCode, translatedText)
      })
    })
  })
})

Template.translate.helpers({

  translation() {
    return getTranslatedText(this.key)
  },
  
  /*
   Return something like:
   [
    {key: "Title", text: "My cool website"}
    ...
   ]
   */
  languageTexts() {
    return languageTextsVar.get()
  },

  fromLanguageName() {
    return getLanguageName(this.fromLanguageCode)
  },

  toLanguageName() {
    return getLanguageName(this.toLanguageCode)
  },

  maybeRightToLeft() {
    //TODO
  },

  rows() {
    return this.text.length / 20
  },

  borderClass() {
    //TODO
  },
  
  googleTranslation() {
    const parentData = Template.parentData()
    return getCachedGoogleTranslation(this.key, parentData.fromLanguageCode, parentData.toLanguageCode)
  }

})

Template.translate.events({
  "blur .translationTextArea"(event) {
    const data = Template.currentData()
    const textArea = event.target
    const key = $(textArea).data("key")
    const translatedText = $(textArea).val()
    
    setTranslatedText(key, translatedText)
  },

  "click .copyButton"(event) {
    const button = event.target
    const key = $(button).data("key")
    const parentData = Template.parentData()

    const googleTranslation = getCachedGoogleTranslation(key, parentData.fromLanguageCode, parentData.toLanguageCode)
    if (googleTranslation) {
      setTranslatedText(key, googleTranslation)
    }
  },

  "click .downloadButton"(event) {
    const allTranslatedText = getAllTranslatedText()
    const allTranslatedTextAsOneString = JSON.stringify(allTranslatedText)
    const fileName = this.toLanguageCode + ".i18n.json"
    const href = 'data:application/json;charset=utf-8,'+ encodeURIComponent(allTranslatedTextAsOneString);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', href);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
  },

  "click .submitButton"(event) {
    setFullTranslation(getAllTranslatedText())
    Router.go("submitTranslation", {
      owner: this.owner,
      repo: this.repo,
      fromLanguageCode: this.fromLanguageCode,
      toLanguageCode: this.toLanguageCode}
    )
  }
})

/**
 * Returns the full translation as an object, like this:
 * {
 *   title: "My cool site",
 *   greeting: "Hello there"
 * }
 */
function getAllTranslatedText() {
  const allTranslatedText = {}
  languageTextsVar.get().forEach((languageText) => {
    const key = languageText.key
    const translatedText = getTranslatedText(key)
    if (translatedText) {
      allTranslatedText[key] = translatedText
    }
  })
  return allTranslatedText
}
