import { DeskThing, SocketData } from "deskthing-server";
// Doing this is required in order for the server to link with DeskThing
export { DeskThing };

// The following imports are from other files that setup their own functions
import { setupSettings } from "./settings";
import { userInput } from "./userInput";
// import { sendImage, sendSampleData } from "./sendingData";

/**
 *
 *  ----------- Setup ------------------
 *
 *  Every app needs the following two:
 * DeskThing.on('start', start)
 *
 * DeskThing.on('stop', stop)
 *
 * Both of these should be at the end of your index.ts page. 'start' is triggered when the server is started and 'stop' is triggered when the server is stopped.
 *
 *
 * The following start() function is triggered once the server starts. This is where all initialization should be done.
 */
const start = async () => {
  // Grab any associated data from the server once the app starts
  const Data = await DeskThing.getData();

  setupSettings(Data);
  userInput(Data);
  // This will make Data.settings.theme.value equal whatever the user selects
};

const stop = async () => {
  DeskThing.sendLog("Server Stopped");
};

// Main Entrypoint of the server
DeskThing.on("start", start);

// Main exit point of the server
DeskThing.on("stop", stop);

// Sending a message to the client
DeskThing.send({ type: 'message', payload: 'Hello, Client!'});

// Listening for a response from the client
DeskThing.on('data', (data) => {
    console.log('Received data from client:', data.payload); // will print "someResponse" in this example
});

DeskThing.on('set', (data) => {
    console.log('Received data from client:', data.payload.key); // will print 'value' in this example
});
