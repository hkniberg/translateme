const util = require('../lib/util.js')
const expect = require('chai').expect
const fs = require('fs')
const path = require('path')

export function testFileName(pluginName, languageCode, path) {

  const plugin = getPlugin(pluginName)
  const fileName = util.removeParentsFromPath(path)
  if (languageCode == null) {
    expect(plugin.getLanguageOfFile(fileName)).to.be.null
    expect(plugin.getLanguageOfFile(path)).to.be.null
  } else {
    expect(plugin.getFileNameForLanguage(languageCode)).to.equal(fileName)
    expect(plugin.getLanguageOfFile(fileName)).to.equal(languageCode)
    expect(plugin.getLanguageOfFile(path)).to.equal(languageCode)
  }

}

export function testFileParsing(pluginName) {
  const plugin = getPlugin(pluginName)

  const testFilesDir = path.join(__dirname, pluginName + "/localeFiles")

  const testFiles = fs.readdirSync(testFilesDir)
  testFiles.forEach((testFile) => {
    //Get the file contents
    const testFileContents = String(fs.readFileSync(path.join(testFilesDir, testFile)))

    //Convert it to language texts
    const languageTexts = plugin.convertFileContentsToLanguageTexts(testFile, testFileContents)

    //Convert it back to file contents.
    const testFileContentsAfter = plugin.convertLanguageTextsToFileContents(testFile, languageTexts)

    //The new file contents may have slightly different formatting than the
    //old file contents (quotes and whitepace and such).
    //So to be able to compare, we'll parse it into languageTexts again...
    const languageTextsAfter = plugin.convertFileContentsToLanguageTexts(testFile, testFileContentsAfter)

    //And then compare the language texts before and after.
    //Should be exactly the same, even when stringified!

    expect(languageTexts).to.deep.equal(languageTextsAfter)
    expect(JSON.stringify(languageTexts)).to.equal(JSON.stringify(languageTextsAfter))
  })
}

export function getPlugin(pluginName) {
  return require("../lib/plugins/" + pluginName + ".js")
}
