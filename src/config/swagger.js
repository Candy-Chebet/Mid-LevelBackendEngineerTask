const swaggerJSdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");


const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Order Service API",
            version: "1.0.0",
            description: "API documentation for the Order Service",
        },
        servers: [
            {
                url: process.env.API_URL || "http://localhost:3000",
                description: process.env.NODE_ENV || 'Development server',
            },
            
        ],
    },
    apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSdoc(options);

module.exports = {
    swaggerUi,
    swaggerSpec,
};
