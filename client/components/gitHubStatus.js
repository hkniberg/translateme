import {getGitHubAccessToken} from "../authentication";
Template.gitHubStatus.helpers({
  gitHubAccessToken() {
    return getGitHubAccessToken()
  }
})