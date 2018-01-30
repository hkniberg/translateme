import {Meteor} from "meteor/meteor"
import {Router} from "meteor/iron:router"


Router.configure({
  layoutTemplate: 'layout'
});


Router.route('/', {
  name: 'start'
})

Router.route('/selectProjectToTranslate')

Router.route('/createButton')

Router.route('/languages/:owner/:repo', {
  name: 'languages',
  data: function() {
    return this.params
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

Router.route('/review/fromOwner/fromRepo/fromLanguageCode/toOwner/toRepo/toLanguageCode', {
  name: 'review',
  data: function() {
    return this.params
  }
})


Router.route('/oauthCallback')
