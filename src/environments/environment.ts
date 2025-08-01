// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false, // set to true when releasing
  serviceURI: 'https://zerowaste.cs.usm.my/speba/apiv2',
  // serviceURI: 'http://localhost/speba_api',
  // serviceURI : "http://localhost:3000",

  firebaseConfig: {
    apiKey: "AIzaSyAoEJxhA5FkZi42TggIS3N1ookYrRdhYIA",
    authDomain: "zero-waste-51581.firebaseapp.com",
    projectId: "zero-waste-51581",
    storageBucket: "zero-waste-51581.firebasestorage.app",
    messagingSenderId: "945729264819",
    appId: "1:945729264819:web:166ec8f6eabcb69c12e4c6",
    measurementId: "G-CHE8170XM2"
  }
};


/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
