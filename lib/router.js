import {Meteor} from "meteor/meteor"
import {Router} from "meteor/iron:router"


Router.configure({
  layoutTemplate: 'layout'
});


Router.route('/', {
  name: 'start'
})

Router.route('/selectProject', {
})

Router.route('/view', {
})

