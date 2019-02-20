'use strict';

module.exports.hello = RavenLambdaWrapper.handler(Raven, async (event, context) => {
    throw new Error("AHHHHH");
});
