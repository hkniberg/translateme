module.exports = {
  getName() {
    return "meteorTap"
  },

  getTypicalLocalePaths() {
    return ["i18n"]
  },

  getLanguageOfFile(path) {
    console.log("getLanguageOfFile", path)
    const regexp = /(\w*)\..*/
    //Figure out if this file looks like "en.i18n.json"
    const match = path.match(regexp)
    if (match) {
      return match[1]
    } else {
      return null
    }
  },

  getFileNameForLanguage(languageCode) {
    return languageCode + ".i18n.json"
  },

  convertFileContentsToLanguageTexts(fileContents) {
    return JSON.parse(fileContents)
  },

  convertLanguageTextsToFileContents(languageTexts) {
    return JSON.stringify(languageTexts)
  }
}

