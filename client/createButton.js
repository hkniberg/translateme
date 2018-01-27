import {parseGitUrl} from "./util";

const translationUrlVar = new ReactiveVar()

Template.createButton.events({
  "click .createButtonButton"() {
    const url = $(".projectUrl").val()
    const parsedUrl = parseGitUrl(url)
    
    const relativeUrl = "languages/" + parsedUrl.owner + "/" + parsedUrl.repo
    translationUrlVar.set(Meteor.absoluteUrl(relativeUrl))
  }
})

Template.createButton.helpers({
  translationUrl() {  
    return translationUrlVar.get()
  },

  buttonSource() {
    const url = translationUrlVar.get()

    return `<div style="background-color: greenyellow; border: solid gray 1px; border-radius: 8px; padding: 3px; margin-top: 5px; display: inline-block;"><a href="${url}">Hi</a></div>`
  }
})
