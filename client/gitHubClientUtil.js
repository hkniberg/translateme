import {Session} from "meteor/session"
import {saveLanguageDataToLocalStorage} from "./translationStatus";

export function signInToGitHub() {
  const data = Template.currentData()
  if (data) {
    if (data.fromLanguageCode) {
      saveLanguageDataToLocalStorage(data.owner, data.repo, data.fromLanguageCode)
    }
    if (data.toLanguageCode) {
      saveLanguageDataToLocalStorage(data.owner, data.repo, data.toLanguageCode)
    }
  }

  const clientId = Meteor.settings.public.clientId
  console.assert(clientId, "clientId is missing from Meteor.settings.public!")

  const path = window.location.pathname
  const query = window.location.search

  let url = "https://github.com/login/oauth/authorize"
  url = url + "?client_id=" + clientId
  url = url + "&state=" + encodeURIComponent(path + query)
  url = url + "&scope=repo"

  console.log("Opening ", url)
  
  window.open(url, "_self")
}