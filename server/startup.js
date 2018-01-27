import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  //Make clientId available to the client
  Meteor.settings.public.clientId = process.env.oauthClientId
});
