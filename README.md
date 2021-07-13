# medienhaus-cms

## Custom medienhaus stateEvent

The cms uses a custom stateEvent `m.medienhaus.meta` to store information about the room.

You can fetch the event via the api or matrix sdk by calling `matrixClient.getStateEvent(roomId, 'm.medienhaus.meta'` which will return: 
```
content: {
          rundgang: 21,
          type: 'studentproject',
          version: '0.1'
        }
```
The custom fetchJoinedSpaces Hook also returns an object with our stateEvent in the key `meta`:

```
name: room_name,
room_id: room_id,
published: public,
collab: false,
avatar_url: mxc://image,
description: room_topic,
meta: m.medienhaus.meta
 ```

## Development

### Installation

#### `npm install`

Installs all of the application's dependencies.

### Configuration

Configuration happens via environment variables. To start developing locally just copy the supplied `.env.local.example` file to `.env.local` and adjust the values of the variables to your liking. Check the `.env` file for more available variables, which you can also then modify in your `.env.local` file.

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the application in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

#### `npm run build`

Builds the application for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started). To learn React, check out the [React documentation](https://reactjs.org/).