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
    const regexp = /^(\w{2})\.yml/
    //Figure out if this file looks like "en.yml"
    const match = path.match(regexp)
    if (match) {
      return match[1]
    } else {
      return null
    }
  },

  getFileNameForLanguage(languageCode) {
    return languageCode + ".yml"
  },

  convertFileContentsToLanguageTexts(fileName, fileContents) {


    /*
      fileContents is something like:

      en:
        label1: hi
        label2: there
        faq:
          faq1: Who am I?
          faq2: Who are you?
     */
    const languageCode = this.getLanguageOfFile(fileName)

    //Let's parse it into an object
    const parsedFile =  yaml.parse(fileContents)

    //Then let's remove the top level, since that is the language code.
    const parsedFileWithoutLanguageCode = parsedFile[languageCode]

    //And flatten it
    const languageTexts = flatten(parsedFileWithoutLanguageCode)

    /*
      We should now have:
      {
        label1: hi
        label2: there
        faq.faq1: Who am I?
        faq.faq2: Who are you?
      }
     */

    return languageTexts
  },

  convertLanguageTextsToFileContents(fileName, languageTexts) {
    const languageCode = this.getLanguageOfFile(fileName)

    const unflattened = unflatten(languageTexts)


    const unflattenedWithParent = {}
    unflattenedWithParent[languageCode] = unflattened

    const text = yaml.dump(unflattenedWithParent)
    return text
  }
}

