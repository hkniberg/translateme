const util = require("../util")

module.exports = {
  getName() {
    return "meteorTap"
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

