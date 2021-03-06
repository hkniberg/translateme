const util = require("../util")

//See /plugins.md for docs on these functions

module.exports = {
  getName() {
    return "meteorTap"
  },

  getDescription() {
    return "Meteor with Tap:i18n"
  },

  getInfoUrl() {
    return "https://github.com/TAPevents/tap-i18n"
  },

  getExampleUrl() {
    return "https://github.com/hkniberg/dingoblat/tree/master/i18n"
  },

  getTypicalLocalePaths() {
    return ["i18n"]
  },
  
  getLanguageOfFile(path) {
    const fileName = util.removeParentsFromPath(path)
    const regexp = /(\w*)\..*/
    //Figure out if this file looks like "en.i18n.json"
    const match = fileName.match(regexp)
    if (match) {
      return match[1]
    } else {
      return null
    }
  },

  getFileNameForLanguage(languageCode) {
    return languageCode + ".i18n.json"
  },

  convertFileContentsToLanguageTexts(fileName, fileContentsAsString) {
    return JSON.parse(fileContentsAsString)
  },

  convertLanguageTextsToFileContents(fileName, languageTexts) {
    return JSON.stringify(languageTexts, null, 2)
  }
}

