import {Session} from "meteor/session"

export function signInToGitHub() {
  const clientId = Meteor.settings.public.clientId
  console.assert(clientId, "clientId is missing from Meteor.settings.public!")

  const path = window.location.pathname

  let url = "https://github.com/login/oauth/authorize"
  url = url + "?client_id=" + clientId
  url = url + "&state=" + encodeURIComponent(path)
  url = url + "&scope=repo"

  Session.set("x", 23)
  
  window.open(url, "_self")
}