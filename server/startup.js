import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  Meteor.settings.public.clientId = process.env.oauthClientId
  console.log("set clientId to " + Meteor.settings.public.clientId)
});
