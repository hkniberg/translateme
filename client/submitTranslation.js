import {getFullTranslation} from "./translationStatus";
import {clearError} from "./helpers";
import {setError} from "./helpers";
import {getGitHubAccessToken} from "./authentication";
import {getLanguageName} from "../lib/data/languages";

const submittingVar = new ReactiveVar(false)
const resultVar = new ReactiveVar(false)


Template.submitTranslation.onRendered(function() {
  clearError("submitTranslation")
  const data = Template.currentData()
  console.assert(data.owner, "Missing owner")
  console.assert(data.repo, "Missing repo")
  console.assert(data.fromLanguageCode, "Missing owner")
  console.assert(data.toLanguageCode, "Missing owner")

  const fullTranslation = getFullTranslation()
  if (!fullTranslation) {
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

  fullTranslation() {
    return JSON.stringify(getFullTranslation(), null, 2)
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
  const fullTranslation = getFullTranslation()
  const comment = $(".commentInput").val()
  submittingVar.set(true)
  resultVar.set(null)

  console.log("calling submitTranslation...")
  Meteor.call("submitTranslation", data.owner, data.repo, data.fromLanguageCode, data.toLanguageCode, fullTranslation, comment,  getGitHubAccessToken(), function(err, result) {
    console.log("Done!", err, result)
    submittingVar.set(false)
    if (err) {
      setError("submitTranslation", "forkRepo method failed!", err)
      return
    }
    resultVar.set(result)
  })
}

