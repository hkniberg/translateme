import {getLanguageName} from "../lib/data/languages";
import {getCachedGoogleTranslation} from "./googleTranslationCache";
import {setLanguageText} from "./translationStatus";
import {getLanguageText} from "./translationStatus";
import {getLanguageData} from "./translationStatus";
import {downloadTranslation} from "./helpers";


const loadingVar = new ReactiveVar(true)
/*
Expected data context:
  - owner
  - repo
  - fromLanguageFile
  - fromLanguageCode
  - toLanguageCode
 */
Template.translate.onRendered(function() {
  console.log("translate onRendered", Template.currentData())
  const data = Template.currentData()
  console.assert(data.owner, "owner missing")
  console.assert(data.repo, "repo missing")
  console.assert(data.fromLanguageCode, "fromLanguageCode missing")
  console.assert(data.toLanguageCode, "toLanguageCode missing")
})

Template.translate.helpers({

  textKeys() {
    return getTextKeys(this.fromLanguageCode)
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

  rowsToUseForTranslatedText() {
    const key = this
    const fromLanguageCode = Template.parentData().fromLanguageCode
    const fromLanguageText = getLanguageText(fromLanguageCode, key)
    if (fromLanguageText) {
      return Math.max(fromLanguageText.length / 20, 2)
    } else {
      return 2
    }
  },

  borderClass() {
    //TODO
  },

  fromLanguageText() {
    const key = this
    const fromLanguageCode = Template.parentData().fromLanguageCode
    return getLanguageText(fromLanguageCode, key)
  },

  toLanguageText() {
    const key = this
    const toLanguageCode = Template.parentData().toLanguageCode
    return getLanguageText(toLanguageCode, key)
  },

  googleTranslationText() {
    const key = this
    const fromLanguageCode = Template.parentData().fromLanguageCode
    const toLanguageCode = Template.parentData().toLanguageCode
    return getCachedGoogleTranslation(key, fromLanguageCode, toLanguageCode)
  }

})

Template.translate.events({
  "blur .translationTextArea"(event) {
    const data = Template.currentData()
    const toLanguageCode = data.toLanguageCode
    const textArea = event.target
    const key = $(textArea).data("key")
    const translatedText = $(textArea).val()
    
    setLanguageText(toLanguageCode, key, translatedText)
  },

  "click .copyButton"(event) {
    const button = event.target
    const key = $(button).data("key")
    const fromLanguageCode = Template.currentData().fromLanguageCode
    const toLanguageCode = Template.currentData().toLanguageCode


    const googleTranslation = getCachedGoogleTranslation(key, fromLanguageCode, toLanguageCode)
    if (googleTranslation) {
      setLanguageText(toLanguageCode, key, googleTranslation)
    }
  },

  "click .downloadButton"(event) {
    downloadTranslation(this.fromLanguageCode, this.toLanguageCode)
  },

  "click .submitButton"(event) {
    Router.go("submitTranslation", {
      owner: this.owner,
      repo: this.repo,
      fromLanguageCode: this.fromLanguageCode,
      toLanguageCode: this.toLanguageCode}
    )
  }
})


function getTextKeys(languageCode) {
  const languageData = getLanguageData(languageCode)
  return Object.getOwnPropertyNames(languageData.texts)
}

