import {getFullTranslation} from "./translationStatus";
import {clearError} from "./helpers";
import {setError} from "./helpers";
import {getGitHubAccessToken} from "./authentication";

const submitPressed = new ReactiveVar(false)
const isDone = new ReactiveVar(false)

const forkStatus = new ReactiveVar("To Do")
const commitStatus = new ReactiveVar("To Do")
const pullStatus = new ReactiveVar("To Do")

Template.submitTranslation.onRendered(function() {
  clearError("submitTranslation")
  const data = Template.currentData()
  console.assert(data.owner, "Missing owner")
  console.assert(data.repo, "Missing repo")
  console.assert(data.fromLanguageCode, "Missing owner")
  console.assert(data.toLanguageCode, "Missing owner")
  const fullTranslation = getFullTranslation()
  if (!fullTranslation) {
    setError("submitTranslation", "Looks like your session has expired!")
  }
  isDone.set(false)
})


Template.submitTranslation.helpers({
  submitPressed() {
    return submitPressed.get()
  },

  done() {
    return isDone.get()
  },

  fullTranslation() {
    return JSON.stringify(getFullTranslation())
  },

  forkStatus() {
    return forkStatus.get()
  },

  commitStatus() {
    return commitStatus.get()
  },

  pullStatus() {
    return pullStatus.get()
  }

})

Template.submitTranslation.events({
  "click .submitButton"() {
    submit()
  }
})

function submit() {
  const data = Template.currentData()
  const fullTranslation = getFullTranslation()
  submitPressed.set(true)
  forkStatus.set("Doing...")
  console.log("calling forkRepo...")

  Meteor.call("forkRepo", data.owner, data.repo, getGitHubAccessToken(), function(err, result) {
    if (err) {
      forkStatus.set("Failed!")
      setError("submitTranslation", "forkRepo method failed!", err)
      return
    }
    forkStatus.set("Done!")

    commitStatus.set("Doing...")
    Meteor.call("commit", data.owner, data.repo, data.toLanguageCode, fullTranslation, getGitHubAccessToken(), function(err, result) {
      if (err) {
        commitStatus.set("Failed!")
        setError("submitTranslation", "commit method failed!", err)
        return
      }
      commitStatus.set("Done!")

      isDone.set(true)

    })
    
    
    
  })

  //Fork the project


  //Add the file
  //Commit
  //Send pull request
}

function setDoing(action) {
  setStatus(action, "Doing...")
}

function setDone(action) {
  setStatus(action, "Done!")
}

function setFailed(action) {
  setStatus(action, "Failed!")
}

function setStatus(action, status) {
  const checklist = checklistVar.get()
  checklist.forEach((item) => {
    if (item.action == action) {
      item.status = status
    }
  })
  checklistVar.set(checklist)
}
