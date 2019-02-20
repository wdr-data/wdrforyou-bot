const Raven = require("raven");
const RavenLambdaWrapper = require("serverless-sentry-lib");

module.exports.hello = RavenLambdaWrapper.handler(Raven, async (event, context) => {
    throw new Error("AHHHHH");
});
