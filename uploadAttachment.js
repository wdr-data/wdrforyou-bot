import { uploadAttachment } from "./lib/facebookAttachments";
import { guessAttachmentType } from "./lib/facebook";
import DynamoDbCrud from "./lib/dynamodbCrud";

async function send(stage, url) {
    const attachmentID = await uploadAttachment(
        url,
        guessAttachmentType(url),
        100000
    );
    console.log(attachmentID);

    const attachments = new DynamoDbCrud(`newsforyou-bot-${stage}-attachments`);
    const item = await attachments.create(url, {attachment_id: attachmentID}, 'url');
    console.log(item);
}

send(process.argv[2], process.argv[3]);
