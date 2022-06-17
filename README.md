<img src="public/medienhaus.png" width="70" />

### medienhaus/

customizable modular free and open-source environment for decentralized, distributed communication and collaboration. info@medienhaus.dev

[Concept Paper](https://medienhaus.dev/) | [Twitter](https://twitter.com/medienhaus_)

<br>

# medienhaus/cms

`medienhaus-cms` is a federatable, room-based content management system (CMS) using the [Matrix](https://matrix.org/) protocol.
The project was used for Berlin University of the Arts’ digitally enhanced [Rundgang 2021](https://rundgang.udk-berlin.de/).

## Configuration

If you have special requirements you can configure the cms by copying config.example.json to config.json and modifying it.

```
{
  "medienhaus": {
    "context": {
      "faculty": {
        "label": "Faculty"
        }
    },
    "item": {
      "blog": {
        "label": "Blog Post",
        "blueprint": [
          "location",
          "contributors",
          "image",
          "time"
        ],
        "content": [
          "heading",
          "text",
          "list",
          "quote",
          "code",
          "image",
          "audio",
          "video",
          "playlist",
          "livestream",
          "bigbluebutton"
        ]
      },
      "article": {
        "label": "Article",
        "blueprint": [
          "location",
          "image"
        ],
        "content": [
          "heading",
          "text",
          "image",
          "audio"
        ]
      }
    }
  },
  "sites": {
    "account": {
      "avatar": true,
      "mail": true,
      "name": true
    },
    "moderate": {
      "invite": true,
      "rightsManagement": true,
      "manageContexts": true
    },
    "support": true,
    "request": true,
    "feedback": true
  },
  "languages": [
    "en",
    "es",
    "de"
  ],
  "usersToInviteToNewContexts": [
    "@user1:server.com"
  ],
  "location": {
    "lat": 0.0,
    "lng": 0.0
  }
}
```

## Item

You can define different types of items the cms is supposed to support.

This gives you the ability to use different blueprints for different types.

## Pages

Any pages defined here will show up in the navigation. 

You can simply add a “page” as a content type and manage them from the /content route. Simply add the content’s room id to the config. 

<aside>
💡 This also means that any user can add pages to the navigation bar!
</aside>

You can also add rooms you are not managing with the cms, as long as they follow the medienhaus scheme, or have a second medienhaus-cms instance you use to moderate pages.

## Blueprint
Define which of the following UI elements should be visible in the /create route.

**Image**

Add a main image to your content.

**Contributors**

Gives users the ability to invite contributors who can edit the content.

**Location**

Adds a UI to add a location to the content.
You can specify a default location with the separate 'location' key.

**Time**

Adds a UI to add a time window to content.
### Content

You can define which types of content are listed in the dropdown of the /create route.

Each type of content can have one or all of the following:

**heading**  
**text**  
**list**   
**quote**  
**code**  
**image**  
**audio**  
**video**  
**livestream**  
**playlist**  
**bigbluebutton**  

## Languages

Define all languages you want the CMS to support as **ISO 639-1 codes.**

Cannot be empty! At least one language has to be defined.

If more than one language is specified, a dropdown appears in the /create route so users are able to create content in the different languages. 

`language[0]` is the default language selected and also the selected language for the topic of the content space.

## usersToInviteToNewContexts

All users specified in this array are automatically invited to new context spaces if they are created through the manage context UI in /manage and promoted to power level 50.

If no users are given, the context spaces are created without inviting any other users.


## Sites

Define which sites should be visible and which functions should be available in each route.

### Account

**avatar**

users are able to change their profile picture from within the accout route.

**mail**

gives users the ability to add one or more email addresses to their account.

**name**

gives users the ability to change their display name.

## moderate

**invite**

Invite users to specific rooms you are moderating

**rightsManagement**

promote users to moderators within a specified context

**manageContexts**

add or remove context spaces or sub-context spaces

**showRoot:** if enabled the root of all contexts is displayed in the manage context dropdown.

## support

shows a link to a support page in the navigation.

<aside>
💡 request, support and feedback requires  https://github.com/medienhaus/medienhaus-backend
</aside>

## request

shows a link to a request form in the navigation .

users are able to request context spaces if they don’t have the rights to add them themselves. 

<aside>
💡 request, support and feedback requires  https://github.com/medienhaus/medienhaus-backend
</aside>

## feedback

shows a link to a feedback form in the navigation .

users are able to give feedback via a form.

<aside>
💡 request, support and feedback requires  https://github.com/medienhaus/medienhaus-backend
</aside>

## Custom stateEvent

The CMS uses a custom stateEvent `dev.medienhaus.meta` to store information about rooms.

You can fetch the event via API or `matrix-js-sdk` by calling `matrixClient.getStateEvent(roomId, 'dev.medienhaus.meta'` which will return: 

```
content: {
  rundgang: 21,
  type: 'studentproject',
  version: '0.1'
}
```

The custom `fetchJoinedSpaces` Hook also returns an object with our stateEvent in the `meta` key:

```
avatar_url: mxc://image,
collab: false,
description: room_topic,
meta: dev.medienhaus.meta,
name: room_name,
published: public,
room_id: room_id
 ```

## Development

### Installation

#### `npm install`

Installs all of the application’s dependencies.

### Configuration

Configuration happens via environment variables. To start developing locally, just copy the supplied `.env.local.example` file to `.env.local` and adjust the values of the variables to your liking. Check the `.env` file for more available variables, which you also can modify in your `.env.local` file.

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the application in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits. You will also see any lint errors in the console.

#### `npm run build`

Builds the application for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance. The build is minified and the filenames include the hashes.

See the section about [Create React App deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
