<img src="public/favicon.svg" width="70" />

### medienhaus/

Berlin University of the Arts’ free and open-source environment for digital learning, teaching, and collaboration.

[Concept Paper](https://medienhaus.dev/) | [Twitter](https://twitter.com/medienhaus_)

## medienhaus/cms

`medienhaus-cms` is a federatable, room-based content management system (CMS) using the [Matrix](https://matrix.org/) protocol. At the moment the project is still adapted to fit the needs of the Berlin University of the Arts’ digitally enhanced [Rundgang 2021](https://www.udk-berlin.de/universitaet/marketing-zentrale-veranstaltungen/zentrale-veranstaltungen/rundgang-tage-der-offenen-tuer-der-udk-berlin/rundgang-plattform/). In the future, `medienhaus-cms` will feature customisation options to fit specific needs.

### medienhaus/ stateEvent

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

Runs the application in development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

#### `npm run build`

Builds the application for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

See the section about [Create React App deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started). To learn React, check out the [React documentation](https://reactjs.org/).
