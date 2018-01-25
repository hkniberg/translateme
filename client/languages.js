import {setLoading} from "./helpers";
import {setError} from "./helpers";
import {clearError} from "./helpers";
import {getAllLanguages} from "../lib/data/languages";

const projectLanguagesVar = new ReactiveVar()
const selectedLanguageCodeVar = new ReactiveVar()

Template.languages.onRendered(function() {
  setLoading(true)
  clearError(true)

  const data = Template.currentData()

  Meteor.call("getLanguages", data.owner, data.repo, function(err, languages) {
    setLoading(false)
    if (err) {
      setError("getTranslationOverview failed", err)
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
  }
})
