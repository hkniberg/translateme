Template.languageTile.onRendered(function() {
  $('.progress .progress-bar').progressbar({
    display_text: 'center',
    use_percentage: false,
    amount_format: function(part, total) {return part + ' / ' + total + " texts"}
  })
})

Template.languageTile.helpers({
  dangerOrSuccess() {
    const languageInfo = this.languageInfo
    const maxTextCount = this.maxTextCount
    if (languageInfo.textCount >= maxTextCount) {
      return "success"
    } else {
      return "danger"
    }
  }
})