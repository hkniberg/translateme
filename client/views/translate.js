import {getLanguageName} from "../../lib/data/languages";
import {getCachedGoogleTranslation} from "./../googleTranslationCache";
import {setLanguageText} from "./../translationStatus";
import {getLanguageText} from "./../translationStatus";
import {getLanguageData} from "./../translationStatus";
import {downloadLanguageFile} from "./../helpers";


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
  const data = Template.currentData()
  console.assert(data.owner, "owner missing")
  console.assert(data.repo, "repo missing")
  console.assert(data.fromLanguageCode, "fromLanguageCode missing")
  console.assert(data.toLanguageCode, "toLanguageCode missing")
})

Template.translate.helpers({

  textKeys() {
    return getTextKeys(this.owner, this.repo, this.fromLanguageCode)
  },

  fromLanguageName() {
    let fromLanguageCode = Template.currentData().fromLanguageCode
    if (!fromLanguageCode) {
      fromLanguageCode = Template.parentData().fromLanguageCode
    }
    
    return getLanguageName(fromLanguageCode)
  },

  toLanguageName() {
    return getLanguageName(this.toLanguageCode)
  },

  maybeRightToLeft() {
    //TODO
  },

  rowsToUseForTranslatedText() {
    const key = this
    const data = Template.parentData()
    const fromLanguageCode = data.fromLanguageCode
    const fromLanguageText = getLanguageText(data.owner, data.repo, fromLanguageCode, key)
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
    const data = Template.parentData()
    const fromLanguageCode = data.fromLanguageCode
    return getLanguageText(data.owner, data.repo, fromLanguageCode, key)
  },

  toLanguageText() {
    const key = this
    const data = Template.parentData()
    const toLanguageCode = data.toLanguageCode
    return getLanguageText(data.owner, data.repo, toLanguageCode, key)
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
    
    setLanguageText(data.owner, data.repo, toLanguageCode, key, translatedText)
  },

  "click .copyButton"(event) {
    const button = event.target
    const key = $(button).data("key")
    const data = Template.currentData()
    const fromLanguageCode = data.fromLanguageCode
    const toLanguageCode = data.toLanguageCode


    const googleTranslation = getCachedGoogleTranslation(key, fromLanguageCode, toLanguageCode)
    if (googleTranslation) {
      setLanguageText(data.owner, data.repo, toLanguageCode, key, googleTranslation)
    }
  },

  "click .downloadButton"(event) {
    downloadLanguageFile(this.owner, this.repo, this.toLanguageCode)
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


function getTextKeys(owner, repo, languageCode) {
  const languageData = getLanguageData(owner, repo, languageCode)
  return Object.getOwnPropertyNames(languageData.texts)
}

