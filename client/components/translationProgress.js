import {getLanguageData} from "../translationStatus";
/*
Context:
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
    const toLanguageData = getLanguageData(data.owner, data.repo, toLanguageCode)
    $('.progress .progress-bar').progressbar({
      display_text: 'center',
      use_percentage: false,
      amount_format: function(part, total) {return part + ' / ' + total + " texts translated"}
    })
  })

})

Template.translationProgress.helpers({
  translatedTexts() {
    if (this.toLanguageCode) {
      const toLanguageData = getLanguageData(this.owner, this.repo, this.toLanguageCode)
      return Object.getOwnPropertyNames(toLanguageData.texts).length
    }
  },

  totalTexts() {
    if (this.fromLanguageCode) {
      const fromLanguageData = getLanguageData(this.owner, this.repo, this.fromLanguageCode)
      return Object.getOwnPropertyNames(fromLanguageData.texts).length
    }
  }
})
