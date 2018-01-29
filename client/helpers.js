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
  return isLoading()
})

Template.registerHelper('error', function(context) {
  return getError(context)
})

export function isLoading() {
  return !!Session.get('loading')
}

export function setLoading(loading) {
  Session.set('loading', loading)
}

export function getError(context) {
  return Session.get("error " + context)
}

export function setError(context, description, err) {
  console.log("setError called", description, err)
  if (err) {
    if (err.reason) {
      Session.set("error " + context, description + "\n" + err.reason)
    } else {
      Session.set("error " + context, description + "\n" + err)
    }
  } else {
    Session.set("error " + context, description)
  }
}

export function clearError(context) {
  Session.set("error " + context, null)
}
