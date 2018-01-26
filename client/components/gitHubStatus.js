import {getGitHubAccessToken} from "../authentication";
import {signInToGitHub} from "../gitHubClientUtil";
Template.gitHubStatus.helpers({
  gitHubAccessToken() {
    return getGitHubAccessToken()
  }
})

Template.gitHubStatus.events({
  "click .signIn"() {
    signInToGitHub()
  }
})