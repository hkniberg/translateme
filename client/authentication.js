import {Session} from "meteor/session"
export function setGitHubAccessToken(token) {
  console.log("setGitHubAccessToken", token)
  Session.set("gitHubAccessToken", token)
}

export function getGitHubAccessToken() {
  return Session.get("gitHubAccessToken")
}

export function isSignedInToGitHub() {
  return !!getGitHubAccessToken()
}

export function signInToGitHub() {
  console.log("signInToGitHub")
  const data = Template.currentData()

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