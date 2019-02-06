import { sendBroadcastMediaTemplate, buttonPostback } from "./lib/facebook";
import { uploadAttachment } from "./lib/facebookAttachments";

async function send(videoUrl) {
    const attachmentID = await uploadAttachment(
        videoUrl,
        'video',
        100000
    );
    console.log(attachmentID);

    await sendBroadcastMediaTemplate(
        'video',
        attachmentID,
        [buttonPostback(
            '👉 Anmelden 👈',
            { action: 'subscriptions'}
        )],
        true
    )
}

send(process.argv[2]);
