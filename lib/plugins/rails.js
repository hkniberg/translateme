const yaml = require("node-yaml")
const flatten = require('flat')
const unflatten = require('flat').unflatten

module.exports = {
  getName() {
    return "rails"
  },

  getTypicalLocalePaths() {
    return ["config/locales"]
  },

  getLanguageOfFile(path) {
    console.log("getLanguageOfFile", path)
    const regexp = /^(\w{2})\.yml/
    //Figure out if this file looks like "en.yml"
    const match = path.match(regexp)
    if (match) {
      return match[1]
    } else {
      return null
    }
  },

  renameKeys(fromLanguageCode, toLanguageCode, languageTexts) {
    Object.getOwnPropertyNames(languageTexts).forEach((key) => {
      if (key.startsWith(fromLanguageCode + ".")) {
        const value = languageTexts[key]
        delete languageTexts[key]
        const newKey = toLanguageCode + "." + key.substring(fromLanguageCode.length + 1)
        languageTexts[newKey] = value
        console.log("Renamed key " + key + " to " + newKey)
        console.log("  value: " + languageTexts[newKey])
      }
    })
    return languageTexts
  },

  getFileNameForLanguage(languageCode) {
    return languageCode + ".yml"
  },

  convertFileContentsToLanguageTexts(fileContents) {
    const parsed =  yaml.parse(fileContents)
    return flatten(parsed)
  },

  convertLanguageTextsToFileContents(languageTexts) {
    const unflattened = unflatten(languageTexts)
    const text = yaml.dump(unflattened)
    console.log("yaml text is", text)
    return text
  }
}

