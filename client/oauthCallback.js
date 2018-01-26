import {Session} from "meteor/session"

Template.oauthCallback.onRendered(function() {
  const query = Router.current().params.query
  const state = JSON.parse(query.state)
  const owner = state.owner
  const repo = state.repo
  const code = query.code
  console.log("code", code)

  Meteor.call("getGitHubAccessToken", code, function(err, token) {
    console.log("getGitHubAccessToken returned:", err, token)
  })


})