import { DeskThing, AuthScopes, DataInterface } from "deskthing-server";

export const userInput = (Data) => {
  // First check if the user has already been prompted
  if (!Data?.user_input || !Data?.second_user_input) {
    // Define the scopes of the request
    const requestScopes = {
      user_input: {
        value: "",
        label: "Placeholder User Data",
        instructions:
          'You can make the instructions whatever you want. You can also include HTML inline styling like <a href="https://deskthing.app/" target="_blank" style="color: lightblue;">Making Clickable Links</a>.',
      },
      second_user_input: {
        value: "Prefilled Data",
        label: "Second Option",
        instructions: "Scopes can include as many options as needed",
      },
    };

    // Scopes are a {key: value} pair of data that is used to prompt the user for input. The key becomes the key for the value they enter

    // Use this to get the data. It will return the callback with the user data that was inputted
    DeskThing.getUserInput(requestScopes, async (data) => {
      if (data.payload.user_input && data.payload.second_user_input) {
        // You can either save the returned data to your data object or do something with it
        DeskThing.saveData(data.payload);
      } else {
        DeskThing.sendError(
          "Please fill out all the fields! Restart to try again"
        );
      }
    });
  } else {
    // This will be called is the data already exists in the server
    DeskThing.sendLog("Data Exists!");
  }
};
