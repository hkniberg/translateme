import {parseGitUrl} from "../../lib/util";
import {getGitHubAccessToken} from "../authentication";
import {setError} from "../helpers";
import {clearError} from "../helpers";

const checkingVar = new ReactiveVar(false)
const repoNotFoundVar = new ReactiveVar(false)
const languageInfoVar = new ReactiveVar()

function getTranslationUrl() {
  const url = $(".projectUrl").val()
  const parsedUrl = parseGitUrl(url)
  const relativeUrl = "languages/" + parsedUrl.owner + "/" + parsedUrl.repo + "?baseLanguagePath=" + encodeURIComponent(parsedUrl.path)
  return Meteor.absoluteUrl(relativeUrl)
  
}

Template.createButton.helpers({
  translationUrl() {
    if (!languageInfoVar.get()) {
      return
    }
    return getTranslationUrl()

  },

  buttonSource() {
    const url = getTranslationUrl()


    return `<div style="background-color: greenyellow; border: solid gray 1px; border-radius: 8px; padding: 3px; margin-top: 5px; display: inline-block;"><a href="${url}">Hi</a></div>`
  },
  
  checking() {
    return checkingVar.get()
  },
  
  languageInfo() {
    return languageInfoVar.get()
  }
})

Template.createButton.events({
  "click .createButtonButton"() {
    clearError("createButton")
    const url = $(".projectUrl").val()
    const parsedUrl = parseGitUrl(url)
    if (!parsedUrl) {
      setError("createButton", "Er, darn I couldn't parse that GitHub URL")
      return
    }
    const owner = parsedUrl.owner
    const repo = parsedUrl.repo
    const path = parsedUrl.path


    checkingVar.set(true)
    repoNotFoundVar.set(false)
    languageInfoVar.set(null)
    console.log("Calling getLanguageInfo")
    Meteor.call("getLanguageInfo", owner, repo, path, getGitHubAccessToken(), function(err, languageInfo) {
      console.log("Got", err, languageInfo)
      checkingVar.set(false)
      if (err) {
        if (err.error == "notFound") {
          repoNotFoundVar.set(true)
        } else {
          setError("createButton", "isLanguageFileValid failed", err)
        }
        return
      }
      languageInfoVar.set(languageInfo)
    })
    
    
  }
})
