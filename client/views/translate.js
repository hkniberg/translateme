import {getLanguageName} from "../../lib/data/languages";
import {getCachedGoogleTranslation} from "./../googleTranslationCache";
import {downloadLanguageFile} from "./../helpers";
import {triggerGoogleTranslationIfNeeded} from "../helpers";
import {session} from "../session"
import {storage} from "../storage"
import {getLanguageFileData} from "../helpers";

const editedTextsVar = new ReactiveVar({})

/*
Expected data context:
  - owner
  - repo
  - fromLanguageCode
  - toLanguageCode
 */
Template.translate.onRendered(function() {
  const data = Template.currentData()
  console.assert(data.owner, "owner missing")
  console.assert(data.repo, "repo missing")
  console.assert(data.fromLanguageCode, "fromLanguageCode missing")
  console.assert(data.toLanguageCode, "toLanguageCode missing")


  session.clearError("translate")

  session.loadEditedTextsFromStorage(data.owner, data.repo, data.toLanguageCode)

  //As soon as we get the languageData for the given fromLanguageCode,
  //we should google-translate it (unless the google translation is already cached)
  this.autorun(() => {
    const fromLanguageData = session.getLanguageData(data.owner, data.repo, data.fromLanguageCode)
    if (fromLanguageData) {
      triggerGoogleTranslationIfNeeded(data.owner, data.repo, fromLanguageData, data.toLanguageCode)
    }
  })

})

Template.translate.helpers({
  languageCodesToLoad() {
    return [this.fromLanguageCode, this.toLanguageCode]
  },

  manyTexts() {
    const keys = getTextKeys(this.owner, this.repo, this.fromLanguageCode)
    return keys && keys.length > 10
  },
  
  
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

  rowCountToUseForTranslatedText() {
    const key = this
    const data = Template.parentData()
    const fromLanguageCode = data.fromLanguageCode
    const fromLanguageText = session.getLanguageText(data.owner, data.repo, fromLanguageCode, key)
    if (fromLanguageText) {
      return Math.max(fromLanguageText.length / 20, 2)
    } else {
      return 2
    }
  },

  /*
   {fileName: ...., fileContent: ....}
   */
  translationDoc() {
    return getLanguageFileData(this.owner, this.repo, this.fromLanguageCode, this.toLanguageCode)
  },

  borderClass() {
    //TODO
  },

  fromLanguageText() {
    const key = this
    const data = Template.parentData()
    const fromLanguageCode = data.fromLanguageCode
    return session.getLanguageText(data.owner, data.repo, fromLanguageCode, key)
  },

  toLanguageText() {
    const key = this
    const data = Template.parentData()
    const toLanguageCode = data.toLanguageCode
    const editedText = session.getEditedText(data.owner, data.repo, toLanguageCode, key)
    if (editedText != null && editedText != undefined) {
      return editedText
    } else {
      const gitHubText = session.getLanguageText(data.owner, data.repo, toLanguageCode, key)
      return gitHubText
    }
  },

  googleTranslationText() {
    const key = this
    const data = Template.parentData()
    const fromLanguageCode = data.fromLanguageCode
    const toLanguageCode = data.toLanguageCode
    return getCachedGoogleTranslation(data.owner, data.repo, key, fromLanguageCode, toLanguageCode)
  }
})

Template.translate.events({
  "blur .translationTextArea"(event) {
    const data = Template.currentData()
    const toLanguageCode = data.toLanguageCode
    const textArea = event.target
    const key = $(textArea).data("key")
    const newText = $(textArea).val()
    
    session.setEditedText(data.owner, data.repo, toLanguageCode, key, newText)
  },

  "click .copyButton"(event) {
    const button = event.target
    const key = $(button).data("key")
    const data = Template.currentData()
    const fromLanguageCode = data.fromLanguageCode
    const toLanguageCode = data.toLanguageCode


    const googleTranslation = getCachedGoogleTranslation(data.owner, data.repo, key, fromLanguageCode, toLanguageCode)
    if (googleTranslation) {
      session.setEditedText(data.owner, data.repo, toLanguageCode, key, googleTranslation)
    }
  },

  "click .downloadButton"(event) {
    downloadLanguageFile(this.owner, this.repo, this.fromLanguageCode, this.toLanguageCode)
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
  const languageData = session.getLanguageData(owner, repo, languageCode)
  if (languageData) {
    return Object.getOwnPropertyNames(languageData.texts)
  }
}

