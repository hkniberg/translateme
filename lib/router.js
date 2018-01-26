import {Meteor} from "meteor/meteor"
import {Router} from "meteor/iron:router"


Router.configure({
  layoutTemplate: 'layout'
});


Router.route('/', {
  name: 'start'
})

Router.route('/selectProject')

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

Router.route('/oauthCallback')
