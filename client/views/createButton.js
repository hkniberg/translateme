import {parseGitUrl} from "../../lib/util";
import {getGitHubAccessToken} from "../authentication";
import {session} from "../session";

const checkingVar = new ReactiveVar(false)
const repoNotFoundVar = new ReactiveVar(false)
const languageDataVar = new ReactiveVar()
const cantFindWorkingPluginVar = new ReactiveVar()


Template.createButton.onRendered(function() {
  session.clearError("createButton")
})

Template.createButton.helpers({
  repoNotFound() {
    return repoNotFoundVar.get()
  },

  cantFindWorkingPlugin() {
    return cantFindWorkingPluginVar.get()
  },

  translationUrl() {
    if (!languageDataVar.get()) {
      return
    }
    return getTranslationUrl()

  },

  buttonSource() {
    const url = getTranslationUrl()


    return `<div style="background-color: greenyellow; border: solid gray 1px; border-radius: 8px; padding: 3px; margin-top: 5px; display: inline-block;"><a href="${url}">Translate Me</a></div>`
  },
  
  checking() {
    return checkingVar.get()
  },
  
  languageInfo() {
    return languageDataVar.get()
  }
})

Template.createButton.events({
  "click .createButtonButton"() {
    session.clearError("createButton")
    const url = $(".projectUrl").val()
    const parsedUrl = parseGitUrl(url)
    if (!parsedUrl) {
      session.setError("createButton", "Er, darn I couldn't parse that GitHub URL")
      return
    }
    const owner = parsedUrl.owner
    const repo = parsedUrl.repo
    const path = parsedUrl.path
    if (!path) {
      session.setError("createButton", "Your GitHub URL needs to point all the way to a specific file")
      return
    }

    console.log("path", path)

    checkingVar.set(true)
    repoNotFoundVar.set(false)
    cantFindWorkingPluginVar.set(false)
    languageDataVar.set(null)
    
    Meteor.call("getLanguageDataFromPath", {owner, repo, path, gitHubAccessToken: getGitHubAccessToken()}, function(err, languageData) {
      console.log("Got", err, languageData)
      checkingVar.set(false)
      if (err) {
        if (err.error == "notFound") {
          repoNotFoundVar.set(true)
          //session.setError("createButton", "Repo not found", err)
        } else if (err.error = "cantFindWorkingPlugin") {
          cantFindWorkingPluginVar.set(true)
          session.setError("createButton", "Can't find working plugin", err)
        } else {
          session.setError("createButton", "isLanguageFileValid failed", err)
        }
        return
      }
      languageDataVar.set(languageData)
    })
    
    
  }
})



function getTranslationUrl() {
  const url = $(".projectUrl").val()
  const parsedUrl = parseGitUrl(url)
  const relativeUrl = "languages/" + parsedUrl.owner + "/" + parsedUrl.repo + "?baseLanguagePath=" + encodeURIComponent(parsedUrl.path)
  return Meteor.absoluteUrl(relativeUrl)

  cantFindWorkingPluginVar.set(false)
  repoNotFoundVar.set(false)

}