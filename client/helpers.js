Tempate.registerHelper('owner', function() {
  return Session.get("owner")
})

Tempate.registerHelper('repo', function() {
  return Session.get("repo")
})


Tempate.registerHelper('path', function() {
  return Session.get("path")
})