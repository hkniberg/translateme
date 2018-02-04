import {getEnvVariable} from "./serverUtil";

const logAllStackTraces = false

/**
 * Null if google couldn't translate it
 */
export function googleTranslate(text, fromLanguageCode, toLanguageCode) {
  check(text, String)
  check(fromLanguageCode, String)
  check(toLanguageCode, String)

  const googleApiKey = getEnvVariable("googleApiKey")

  var googleTranslate = require('google-translate')(googleApiKey)
  const translate = Meteor.wrapAsync(googleTranslate.translate, googleTranslate.translate)

  const textLines = text.split('\n')
  let translatedText = ""
  try {
    textLines.forEach((textLine) => {
      if (textLine) {
        const translation = translate(textLine, fromLanguageCode, toLanguageCode)
        if (translation.translatedText) {
          translatedText = translatedText + translation.translatedText
        }
      }
      translatedText = translatedText + "\n"
    })
    return translatedText.trim()
  } catch (err) {
    if (logAllStackTraces) {
      console.log("(ignore) google translate failed to translate from " + fromLanguageCode + " to " + toLanguageCode)
    }
    return null
  }
}