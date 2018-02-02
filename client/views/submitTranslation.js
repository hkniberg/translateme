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

  if (!getLanguageData(data.owner, data.repo, data.toLanguageCode)) {
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
    return getLanguageFileData(this.owner, this.repo, this.toLanguageCode)
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
    const data = Template.currentData()
    downloadLanguageFile(data.owner, data.repo, data.toLanguageCode)
  },
  
  "click .signIn"() {
    signInToGitHub()
  },

  "click .translateToAnother"() {
    Router.go("languages", {repo: this.repo, owner: this.owner})
  }
})

function submit() {
  clearError("submitTranslation")
  const data = Template.currentData()
  const toLanguageData = getLanguageData(data.owner, data.repo, data.toLanguageCode)
  const comment = $(".commentInput").val()
  submittingVar.set(true)
  resultVar.set(null)

  const fromLanguageData = getLanguageData(data.owner, data.repo, data.fromLanguageCode)
  const fromLanguageInfo = {
    languageCode: fromLanguageData.languageCode,
    languageName: fromLanguageData.languageName,
    path: fromLanguageData.path,
    fileFormat: fromLanguageData.fileFormat
  }

  Meteor.call("submitTranslation", data.owner, data.repo, fromLanguageInfo, data.toLanguageCode, toLanguageData.texts, comment,  getGitHubAccessToken(), function(err, result) {
    submittingVar.set(false)
    if (err) {
      setError("submitTranslation", "The git voodoo failed! Sometimes it fails the first time and works the second time, not sure why. So try again!", err)
      return
    }
    resultVar.set(result)
  })
}

