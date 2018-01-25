Template.registerHelper('owner', function() {
  return Session.get("owner")
})

Template.registerHelper('repo', function() {
  return Session.get("repo")
})


Template.registerHelper('path', function() {
  return Session.get("path")
})