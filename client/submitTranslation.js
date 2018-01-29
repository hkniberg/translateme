import {clearError} from "./helpers";
import {setError} from "./helpers";
import {getGitHubAccessToken} from "./authentication";
import {getLanguageName} from "../lib/data/languages";
import {getLanguageData} from "./translationStatus";

const submittingVar = new ReactiveVar(false)
const resultVar = new ReactiveVar(false)


Template.submitTranslation.onRendered(function() {
  clearError("submitTranslation")
  const data = Template.currentData()
  console.assert(data.owner, "Missing owner")
  console.assert(data.repo, "Missing repo")
  console.assert(data.fromLanguageCode, "Missing owner")
  console.assert(data.toLanguageCode, "Missing owner")

  console.log("submitTranslation - languageData = ", getLanguageData(data.toLanguageCode))
  if (!getLanguageData(data.toLanguageCode)) {
    setError("submitTranslation", "Looks like your session has expired!")
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

  translationDoc() {
    return JSON.stringify(getLanguageData(this.toLanguageCode).texts, null, 2)
  },

  toLanguageName() {
    return getLanguageName(this.toLanguageCode)
  }
})

Template.submitTranslation.events({
  "click .submitButton"() {
    submit()
  }
})

function submit() {
  clearError("submitTranslation")
  const data = Template.currentData()
  const languageData = getLanguageData(data.toLanguageCode)
  const comment = $(".commentInput").val()
  submittingVar.set(true)
  resultVar.set(null)

  console.log("calling submitTranslation...")
  Meteor.call("submitTranslation", data.owner, data.repo, data.fromLanguageCode, data.toLanguageCode, languageData.texts, comment,  getGitHubAccessToken(), function(err, result) {
    console.log("Done!", err, result)
    submittingVar.set(false)
    if (err) {
      setError("submitTranslation", "forkRepo method failed!", err)
      return
    }
    resultVar.set(result)
  })
}

