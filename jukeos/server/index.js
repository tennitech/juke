import { DeskThing } from "deskthing-server";
// Doing this is required in order for the server to link with DeskThing
export { DeskThing };

// The following imports are from other files that setup their own functions
import { setupSettings } from "./settings";
// import { userInput } from "./userInput";
// import { sendImage, sendSampleData } from "./sendingData";

import axios from "axios";

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
  // userInput(Data);
  // This will make Data.settings.theme.value equal whatever the user selects
};

const stop = async () => {
  DeskThing.sendLog("Server Stopped");
};

// Main Entrypoint of the server
DeskThing.on("start", start);

// Main exit point of the server
DeskThing.on("stop", stop);


async function performFetch(data) {
    console.log('Received fetch url from client:', data.url);
    try {
        const response = await axios.get(data.url, {
            headers: {
                "Authorization": "Bearer " + data.accessToken
            },
            params: data.params,
        });

        DeskThing.send({type: 'get_resp', data: response?.data});
    } catch (err) {
        if (err.response) {
            if (err.response.status === 401) {
                return await performFetch(
                    data, await invalidateAccess()
                );
            }
        }

        throw err;
    }
}

DeskThing.on('fetch', performFetch);

async function performPut(data) {
    console.log('Received put url from client:', data.url);

    try {
        const response = await axios.put(data.url, data.body, {
            headers: {
                "Authorization": "Bearer " + data.accessToken
            },
            params: data.params
        });

        DeskThing.send({type: 'put_resp', data: response?.data});
    } catch (err) {
        if (err.response) {
            if (err.response.status === 401) {
                return await performPut(
                    data, await invalidateAccess()
                );
            }
        }

        throw err;
    }
}

DeskThing.on('fetch', performFetch);
DeskThing.on('put', performPut);
