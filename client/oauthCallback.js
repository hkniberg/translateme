import {Session} from "meteor/session"
import {setError} from "./helpers";
import {clearError} from "./helpers";
import {setGitHubAccessToken} from "./authentication";

Template.oauthCallback.onRendered(function() {
  clearError("oauthCallback")
  const query = Router.current().params.query
  const code = query.code

  const path = query.state

  Meteor.call("requestGitHubAccessToken", code, function(err, token) {
    if (err) {
      setError("oauthCallback", "Something went wrong when calling getGitHubAccessToken", err)
      return
    }
    setGitHubAccessToken(token)
    Router.go(path)
  })
})



