<img src="./public/favicon.svg" width="70" />

### medienhaus/

Customizable, modular, free and open-source environment for decentralized, distributed communication and collaboration without third-party dependencies.

[Website](https://medienhaus.dev/) — [Twitter](https://twitter.com/medienhaus_)

<br>

# medienhaus/ cms

`medienhaus-cms` is a decentralized-first, room-based content management system (CMS) based on the [Matrix](https://matrix.org/) protocol.
The project was used for Berlin University of the Arts’ digitally enhanced [Rundgang](https://rundgang.udk-berlin.de/) in 2021 and 2022.

## Development

### Installation

#### `npm install`

Installs all of the application’s dependencies.

### Configuration

Configuration happens in two places: once via environment variables and secondly via the `src/config.json` file.

To start developing locally, just copy the supplied `.env.local.example` file to `.env.local` and adjust the values of the variables to your liking. Check the `.env.extended.example` file for more available variables, which you can also modify in your `.env.local` file.

Secondly copy the provided `src/config.example.json` to `src/config.json`. Same here: Check out the provided `src/config.extended.example.json` to see which other configuration options are available. Beyond that you can find a more detailed documentation of every configuration variable [at the end of this very README file](#configuration-documentation).

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

<br>

## Configuration Documentation
(compare to `src/config.example.json` and `src/config.extended.example.json`)

### `item`

You can define different types of items the cms is supposed to support.

This gives you the ability to use different blueprints for different types.


#### Blueprints

Define which of the following UI elements should be visible in the /create route.

- `image`: Add a main image to your content.
- `contributors`: Gives users the ability to invite contributors who can edit the content.
- `location`: Adds a UI to add a location to the content. You can specify a default location with the separate 'location' key.
- `time`: Adds a UI to add a time window to content.

#### Allowed content types

You can define which types of content are listed in the dropdown of the /create route.

Each type of content can have one or all of the following:

```
heading
text
list
quote
code
image
audio
video
livestream
playlist
bigbluebutton
```

### `pages`

Any pages defined here will show up in the navigation.

You can simply add a “page” as a content type and manage them from the /content route. Simply add the content’s room id to the config.

<aside>
💡 This also means that any user can add pages to the navigation bar!
</aside>

You can also add rooms you are not managing with the cms, as long as they follow the medienhaus scheme, or have a second medienhaus-cms instance you use to moderate pages.


### `languages`

Define all languages you want the CMS to support as **ISO 639-1 codes.**

Cannot be empty! At least one language has to be defined.

If more than one language is specified, a dropdown appears in the /create route so users are able to create content in the different languages.

`language[0]` is the default language selected and also the selected language for the topic of the content space.


### `sites`

Define which sites should be visible and which functions should be available in each route.

#### `account`

- `avatar`: if users are able to change their profile picture from within the /account route
- `mail`: gives users the ability to add one or more email addresses to their account
- `name`: gives users the ability to change their display name

#### `moderate`

- `invite`: Invite users to specific rooms you are moderating
- `rightsManagement`: promote users to moderators within a specified context
- `manageContexts`: add or remove context spaces or sub-context spaces
  - `showRoot`: if enabled the root of all contexts is displayed in the manage context dropdown.
  - `treeDepth`: depth of the tree shown after selecting a context. defaults to 1.

### `usersToInviteToNewContexts`

All users specified in this array are automatically invited to new context spaces if they are created through the manage context UI in /manage and promoted to power level 50.

If no users are given, the context spaces are created without inviting any other users.

