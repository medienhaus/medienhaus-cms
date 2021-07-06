# medienhaus-cms

### Custom medienhaus stateEvent

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
