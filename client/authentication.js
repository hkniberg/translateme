import {Session} from "meteor/session"
export function setGitHubAccessToken(token) {
  console.log("setGitHubAccessToken", token)
  Session.set("gitHubAccessToken", token)
}

export function getGitHubAccessToken() {
  return Session.get("gitHubAccessToken")
}