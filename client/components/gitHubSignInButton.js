import {signInToGitHub} from "../authentication";

Template.gitHubSignInButton.events({
  "click .signIn"() {
    signInToGitHub()
  }
})