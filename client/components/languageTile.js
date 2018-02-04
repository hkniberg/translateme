Template.languageTile.onRendered(function() {
  const data = Template.currentData()
  check(data.languageData, Object)
  check(data.maxTextCount, Number)

  $('.progress .progress-bar').progressbar({
    display_text: 'center',
    use_percentage: false,
    amount_format: function(part, total) {return part + ' / ' + total + " texts"}
  })
})

Template.languageTile.helpers({
  dangerOrSuccess() {
    const languageData = this.languageData
    const maxTextCount = this.maxTextCount
    if (languageData.textCount >= maxTextCount) {
      return "success"
    } else {
      return "danger"
    }
  }
})