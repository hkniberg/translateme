import {session} from "../session";
/*
Context:
- owner
- repo
- fromLanguageCode
- toLanguageCode
 */
Template.translationProgress.onRendered(function() {
  const data = Template.currentData()
  console.assert(data.fromLanguageCode, "missing fromLanguageCode" )
  console.assert(data.toLanguageCode, "missing toLanguageCode" )

  const fromLanguageCode = data.fromLanguageCode
  const toLanguageCode = data.toLanguageCode


  this.autorun(function() {
    //Autorunning this so that the progress bar gets updated
    //when the texts are updated
    const texts = session.getEditedTexts(data.owner, data.repo, toLanguageCode)
    $('.progress .progress-bar').progressbar({
      display_text: 'center',
      use_percentage: false,
      amount_format: function(part, total) {return part + ' / ' + total + " texts translated"}
    })
  })

})

Template.translationProgress.helpers({
  translatedTextCount() {
    return translatedTextCount(Template.currentData())
  },

  totalTextCount() {
    return totalTextCount(Template.currentData())
  },

  dangerOrSuccess() {
    const data = Template.currentData()
    if (translatedTextCount(data) == totalTextCount(data)) {
      return "success"
    } else {
      return "danger"
    }
  }
})

function translatedTextCount(data) {
  if (data.toLanguageCode) {
    const texts = session.getMergedTexts(data.owner, data.repo, data.fromLanguageCode, data.toLanguageCode)
    if (texts) {
      const count = Object.getOwnPropertyNames(texts).length
      return count
    } else {
      return 0
    }
  }
}

function totalTextCount(data) {
  if (data.fromLanguageCode) {
    const fromLanguageData = session.getLanguageData(data.owner, data.repo, data.fromLanguageCode)
    if (fromLanguageData) {
      return fromLanguageData.textCount
    }
  }
}