const pluginNames = [
  "meteorTap",
  "rails"
]


const plugins = []

export function getPlugins() {
  return plugins
}

export function getPluginNames() {
  return pluginNames
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
    throw new Meteor.Error("There is no plugin named " + pluginName)
  }
  return plugin

}

Meteor.startup(() => {
  pluginNames.forEach((fileName) => {
    registerPlugin(fileName)
  })
});