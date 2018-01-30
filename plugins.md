# Plugin architecture

Different github projects may have different file structures and conventions
for where to put locale files, and which format to use for them.

TranslateMe uses a simple plugin architecture for this.
Each type of repo has a ProjectStructure object, which has the following functions:


```
/*
  Should be the same as the file name, without the extension.
*/
getName()


/*
  Returns an array of paths to folders that typically contain locale files.
  For example ["src/i18n", "src/client/locale"]
*/
getTypicalLocalePaths()


/*
    Given a path such as "lang/en.json",
    returns an ISO language code such as "en",
    or null if the file is not recognized as locale file.
*/
getLanguageOfFile(path)


/*
    Given a language code such as "en",
    returns the name of the file, such as "en.json".
    Just the filename, not the whole path.
    Any new lagnuage files will be stored next to the file that it was translated from.
*/
getFileNameForLanguage(languageCode)

/*
    Takes the given locale file contents (string) and returns all language texts as a flat set of key/value pairs,
    for example {heading1: "Welcome", heading2: "We love you"}
*/
convertFileContentsToLanguageTexts(fileName, fileContents)

/*
    Takes the given language texts (as flat key/value pairs) and turns them into whatever format the file should contain.
    This should be the reverse of loadFileContents(...)
*/
convertLanguageTextsToFileContents(fileName, languageTexts)





```

# How to install a plugin

1. Put your plugin file under /lib/plugins/xxx.js
2. Add your plugin name to the pluginNames array at the top of /lib/initPlugins.js
3. Add a test case and at least one sample file under /test (see /test/meteorTap or /test/rails for an example)
