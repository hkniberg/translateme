import {getPlugins} from "../../lib/initPlugins";
Template.plugins.helpers({
  plugins() {
    return getPlugins()
  },

  name() {
    return this.getName()
  },

  description() {
    return this.getDescription()
  },

  infoUrl() {
    return this.getInfoUrl()
  },

  exampleUrl() {
    return this.getExampleUrl()
  },

  sourceUrl() {
    return "https://github.com/hkniberg/translateme/blob/master/lib/plugins/" + this.getName() + ".js"
  }


})