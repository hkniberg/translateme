export function signInToGitHub() {
  const clientId = Meteor.settings.public.clientId
  console.assert(clientId, "clientId is missing from Meteor.settings.public!")

  let url = "https://github.com/login/oauth/authorize"
  url = url + "?client_id=" + clientId
  url = url + "&scope=repo"

  window.open(url, "_self")
}