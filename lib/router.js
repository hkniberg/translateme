import {Meteor} from "meteor/meteor"
import {Router} from "meteor/iron:router"


Router.configure({
  layoutTemplate: 'layout'
});


Router.route('/', {
  name: 'start'
})

Router.route('/selectProjectToTranslate')

Router.route('/plugins')

Router.route('/createButton')

Router.route('/languages/:owner/:repo', {
  name: 'languages',
  data: function() {
    const data = this.params
    if (this.params.query.baseLanguagePath) {
      data.baseLanguagePath = decodeURIComponent(this.params.query.baseLanguagePath)
    }
    return data
  }
})

Router.route('/translate/:owner/:repo/:fromLanguageCode/:toLanguageCode', {
  name: 'translate',
  data: function() {
    return this.params
  }
})

Router.route('/submitTranslation/:owner/:repo/:fromLanguageCode/:toLanguageCode', {
  name: 'submitTranslation',
  data: function() {
    return this.params
  }
})

Router.route('/review', {
  name: 'review',
  data: function() {
    const query = this.params.query
    return {
      fromOwner: query.fromOwner,
      toOwner: query.toOwner,
      repo: query.repo,
      fromPath: decodeURIComponent(query.fromPath),
      toPath: decodeURIComponent(query.toPath),
      fileFormat: query.fileFormat
    }
  }
})


Router.route('/oauthCallback')
