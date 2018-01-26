import {Session} from "meteor/session"
import {setLoading} from "./helpers";
import {setError} from "./helpers";
import {clearError} from "./helpers";
import {getAllLanguages} from "../lib/data/languages";
import {getGitHubAccessToken} from "./authentication";

const projectLanguagesVar = new ReactiveVar()
const selectedLanguageCodeVar = new ReactiveVar()
const isGitHubErrorVar = new ReactiveVar()

Template.languages.onRendered(function() {
  setLoading(true)
  isGitHubErrorVar.set(false)
  clearError("languages")

  const data = Template.currentData()

  console.log("calling getLanguages with gitHubAccessToken", getGitHubAccessToken())
  Meteor.call("getLanguages", data.owner, data.repo, getGitHubAccessToken(), function(err, languages) {
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
  projectLanguages() {
    return projectLanguagesVar.get()
  },
  
  allLanguages() {
    return getAllLanguages()
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
  "click .submitButton"() {
    const fromLanguageCode = $(".fromLanguageCode").val()
    const toLanguageCode = $(".toLanguageCode").val()
    const data = Template.currentData()
    Router.go('translate', {
      owner: data.owner,
      repo: data.repo,
      fromLanguageCode: fromLanguageCode,
      toLanguageCode: toLanguageCode
    })
  },

  "click .gitHubSignInButton"() {
    const data = Template.currentData()
    const state = JSON.stringify({
      owner: data.owner,
      repo: data.repo
    })
    console.log("data", data)
    console.log("state", state)

    const clientId = "2b90217e4a815fbf42ff" //TEMP
    let url = "https://github.com/login/oauth/authorize"
    url = url + "?client_id=" + clientId
    url = url + "&scope=repos"
    //url = url + "&state=" + state

    window.open(url, "_self")
  }
})
