import {setGitHubAccessToken} from "./authentication";
import {session} from "./session"

Template.oauthCallback.onRendered(function() {
  session.clearError("oauthCallback")
  const query = Router.current().params.query
  const code = query.code

  const path = query.state

  Meteor.call("requestGitHubAccessToken", code, function(err, token) {
    if (err) {
      session.setError("oauthCallback", "Something went wrong when calling getGitHubAccessToken", err)
      return
    }
    setGitHubAccessToken(token)
    console.log("Will go to " + path)
    Router.go(path)
  })
})



