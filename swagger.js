const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    version: "2.0", // by default: '1.0.0'
    title: "Ride API", // by default: 'REST API'
    description: "API that CRUD Ride information", // by default: ''
  },
  host: "localhost:8010", // by default: 'localhost:3000'
  basePath: "", // by default: '/'
  schemes: [], // by default: ['http']
  consumes: [], // by default: ['application/json']
  produces: [], // by default: ['application/json']
  tags: [
    // by default: empty Array
    {
      name: "Ride", // Tag name
      description: "Ride information that container ride and rider detail", // Tag description
    },
    // { ... }
  ],
  securityDefinitions: {}, // by default: empty object (Swagger 2.0)
  definitions: {}, // by default: empty object
  components: {}, // by default: empty object (OpenAPI 3.x)
};

const outputFile = "swagger.json";
const endpointsFiles = ["src/app.js"];

/* NOTE: if you use the express Router, you must pass in the 
   'endpointsFiles' only the root file where the route starts,
   such as: index.js, app.js, routes.js, ... */

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require("./index"); // Your project's root file
});
