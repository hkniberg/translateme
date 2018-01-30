const pluginFileNames = [
  "meteorTap",
  "rails"
]


const plugins = []

export function getPlugins() {
  return plugins
}

export function registerPlugin(pluginFileName) {
  const plugin = require("./plugins/" + pluginFileName + ".js")
  plugins.push(plugin)
}

export function getPluginByName(pluginName) {
  const plugin = plugins.find((plugin) => {
    return plugin.getName() == pluginName
  })
  if (!plugin) {
    console.log("There is no plugin named " + pluginName)
  }
  console.assert(plugin, "There is no plugin named " + pluginName)
  return plugin

}

Meteor.startup(() => {
  pluginFileNames.forEach((fileName) => {
    registerPlugin(fileName)
  })
});