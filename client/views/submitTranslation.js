import {getGitHubAccessToken} from "./../authentication";
import {getLanguageName} from "../../lib/data/languages";
import {downloadLanguageFile} from "./../helpers";
import {isSignedInToGitHub} from "./../authentication";
import {getLanguageFileData} from "../helpers";
import {session} from "../session"
import {storage} from "../storage"
import {getParentOfFile} from "../../lib/util";

const submittingVar = new ReactiveVar(false)
const resultVar = new ReactiveVar(false)


Template.submitTranslation.onRendered(function() {
  session.clearError("submitTranslation")
  resultVar.set(false)
  submittingVar.set(false)

  const data = Template.currentData()
  console.assert(data.owner, "Missing owner")
  console.assert(data.repo, "Missing repo")
  console.assert(data.fromLanguageCode, "Missing owner")
  console.assert(data.toLanguageCode, "Missing owner")

  session.loadEditedTextsFromStorage(data.owner, data.repo, data.toLanguageCode)
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
    return getLanguageFileData(this.owner, this.repo, this.fromLanguageCode, this.toLanguageCode)
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
    downloadLanguageFile(data.owner, data.repo, data.fromLanguageCode, data.toLanguageCode)
  },

  "click .translateToAnother"() {
    const data = Template.currentData()
    session.removeLanguageDatas(data.owner, data.repo)
    Router.go("languages", {repo: this.repo, owner: this.owner})
  }
})

function submit() {
  session.clearError("submitTranslation")
  const data = Template.currentData()
  const commitComment = $(".commentInput").val()
  submittingVar.set(true)
  resultVar.set(null)

  const fromLanguageData = session.getLanguageData(data.owner, data.repo, data.fromLanguageCode)

  const mergedTranslation = session.getMergedTexts(data.owner, data.repo, data.toLanguageCode)

  const params = {
    owner: data.owner,
    repo: data.repo,
    fileFormat: fromLanguageData.fileFormat,
    fromLanguageFile: fromLanguageData.path,
    toLanguageCode: data.toLanguageCode,
    texts: mergedTranslation,
    commitComment: commitComment,
    gitHubAccessToken: getGitHubAccessToken()
  }
  Meteor.call("submitTranslation", params, function(err, result) {
    submittingVar.set(false)
    if (err) {
      session.setError("submitTranslation", "The git voodoo failed! Wonder why? Well, anyway, you can still download your translation and email it to the project owners.", err)
      return
    }
    storage.removeTexts(data.owner, data.repo, data.toLanguageCode)
    resultVar.set(result)
  })
}

