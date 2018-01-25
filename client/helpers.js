import {Session} from "meteor/session"
import {getLanguageName} from "../lib/data/languages";

Template.registerHelper('owner', function() {
  return Session.get("owner")
})

Template.registerHelper('repo', function() {
  return Session.get("repo")
})

Template.registerHelper('path', function() {
  return Session.get("path")
})

Template.registerHelper('loading', function() {
  return Session.get("loading")
})

Template.registerHelper('error', function(context) {
  return getError(context)
})

export function setLoading(loading) {
  Session.set('loading', loading)
}

export function getError(context) {
  return Session.get("error " + context)
}

export function setError(context, description, err) {
  console.log("setError called", description, err)
  Session.set("error " + context, description)
}

export function clearError(context) {
  Session.set("error " + context, null)
}
