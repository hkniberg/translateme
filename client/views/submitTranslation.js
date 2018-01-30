import {clearError} from "./../helpers";
import {setError} from "./../helpers";
import {getGitHubAccessToken} from "./../authentication";
import {getLanguageName} from "../../lib/data/languages";
import {getLanguageData} from "./../translationStatus";
import {downloadLanguageFile} from "./../helpers";
import {signInToGitHub} from "./../gitHubClientUtil";
import {isSignedInToGitHub} from "./../authentication";
import {getLanguageFileData} from "../helpers";

const submittingVar = new ReactiveVar(false)
const resultVar = new ReactiveVar(false)


Template.submitTranslation.onRendered(function() {
  clearError("submitTranslation")
  const data = Template.currentData()
  console.assert(data.owner, "Missing owner")
  console.assert(data.repo, "Missing repo")
  console.assert(data.fromLanguageCode, "Missing owner")
  console.assert(data.toLanguageCode, "Missing owner")

  if (!getLanguageData(data.toLanguageCode)) {
    Router.go('/')
    console.log("Darn! Looks like your session has expired!")
  }
})


Template.submitTranslation.helpers({
  submitting() {
    return submittingVar.get()
  },

  result() {
    return resultVar.get()
  },

  commitUrl() {
    if (resultVar.get()) {
      return resultVar.get().commitUrl
    }
  },

  pullRequestUrl() {
    if (resultVar.get()) {
      return resultVar.get().pullRequestUrl
    }
  },

  pullRequestAlreadyExisted() {
    if (resultVar.get()) {
      return resultVar.get().pullRequestAlreadyExisted
    }
  },

  log() {
    if (resultVar.get()) {
      return resultVar.get().log
    }
  },

  /*
     {fileName: ...., fileContent: ....}
   */
  translationDoc() {
    console.log("content", getLanguageFileData(this.toLanguageCode).fileContent)
    return getLanguageFileData(this.toLanguageCode)
  },

  toLanguageName() {
    return getLanguageName(this.toLanguageCode)
  },

  signedInToGitHub() {
    return isSignedInToGitHub()
  }
})

Template.submitTranslation.events({
  "click .submitButton"() {
    submit()
  },

  "click .downloadButton"() {
    downloadLanguageFile(this.toLanguageCode)
  },
  
  "click .signIn"() {
    signInToGitHub()
  }  
})

function submit() {
  clearError("submitTranslation")
  const data = Template.currentData()
  const toLanguageData = getLanguageData(data.toLanguageCode)
  const comment = $(".commentInput").val()
  submittingVar.set(true)
  resultVar.set(null)

  const fromLanguageData = getLanguageData(data.fromLanguageCode)
  const fromLanguageInfo = {
    languageCode: fromLanguageData.languageCode,
    languageName: fromLanguageData.languageName,
    path: fromLanguageData.path,
    fileFormat: fromLanguageData.fileFormat
  }

  Meteor.call("submitTranslation", data.owner, data.repo, fromLanguageInfo, data.toLanguageCode, toLanguageData.texts, comment,  getGitHubAccessToken(), function(err, result) {
    submittingVar.set(false)
    if (err) {
      setError("submitTranslation", "forkRepo method failed!", err)
      return
    }
    resultVar.set(result)
  })
}

