import {setLoading} from "./helpers"
import {clearError} from "./helpers"
import {setError} from "./helpers";
import {getLanguageName} from "../lib/data/languages";

const languageTextsVar = new ReactiveVar()

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

  setLoading(true)
  clearError("translate", true)


  Meteor.call("getLanguageTexts", data.owner, data.repo, data.fromLanguageCode, function(err, languageTexts) {
    setLoading(false)
    if (err) {
      setError("translate", "getLanguageTexts failed", err)
      return
    }
    languageTextsVar.set(languageTexts)
  })
})

Template.translate.helpers({
  languageTexts() {
    console.log("languageTexts", languageTextsVar.get())
    return languageTextsVar.get()
  },

  fromLanguageName() {
    const data = Template.currentData()
    return getLanguageName(data.fromLanguageCode)
  },

  toLanguageName() {
    const data = Template.currentData()
    return getLanguageName(data.toLanguageCode)
  }

  
})