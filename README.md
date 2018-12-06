# wdrforyou-bot
Bot application for the WDRforyou bot

[![Build Status](https://travis-ci.org/wdr-data/informant-bot.svg?branch=master)](https://travis-ci.org/wdr-data/informant-bot)

### Vorraussetzungen

[Facebook Developer](https://developer.facebook.com/) App mit Messenger Integration: [Anleitung](https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup)

Zunächst sollte der Source-Code lokal vorhanden sein. Dieses Git Kommando legt einen neuen Ordner mit dem Source an.

```
git clone https://github.com/wdr-data/wdrforyou-bot.git
git clone https://github.com/wdr-data/wdrforyou-cms.git
```

### Local development

You need to create a file called `.env.yml` in the root folder of the bot directory.
We will show you how to fill in the variables later in this text.

```yml
DEPLOY_ALIAS: <your name> # The suffix for your personal development deployment
FB_PAGETOKEN:             # Facebook API Token for the page
FB_VERIFYTOKEN:           # Facebook Webhook Verification Token
CMS_API_URL:              # Base URL for CMS (https://github.com/wdr-data/wdrforyou-cms) REST API (with trailing slash)
CMS_API_TOKEN:            # Token to authenticate with CMS REST API (http://www.django-rest-framework.org/api-guide/authentication/#tokenauthentication)
```

### How to start using your local BOT

If not already installed, install `yarn`: https://yarnpkg.com/lang/en/docs/install/
Go to your local repository and run:

```
yarn  OR  yarn install
```

To start with local development:
```
yarn sls deploy
```
If you do this for the first time, you will get a lot of errors. Don't worry, we will fix them step by step by adding the necessary variables to the .env.yml file.

`AWS_Credentials`
ServerlessError: AWS provider credentials not found. Learn how to set up AWS provider credentials in our docs here: <http://bit.ly/aws-creds-setup>.
For easy handling of AWS account use `aws-cli`: https://github.com/aws/aws-cli

Then do:
```aws configure```
AWS Access Key ID [None]:
AWS Secret Access Key [None]:
Default region name [None]:
Default output format [None]:

`FB_PAGETOKEN`
- Create a Page in Facebook.
- Create an `Messenger-App` in Facebook-Developer and generate a `key` for you Page

`CMS_API_TOKEN`
You will need a cms to handle your news content. Set it up as described in ```informant-cms```, then login as admin, generate a token.

`CMS_API_URL`
In `informant-cms` you create an api for your content, provide the url:
CMS_BASE_URL/api/v1

If your `yarn sls deploy` runs successfully:
- you will receive endpoints in your consle, grab the first one - ending with fb
- go to your app on developers.facebook.com and setup a webhook, using the endpoint and the `FB_VERIFYTOKEN` you set up earlier in your `.env.yml`.
- in developers.facebook.com go to 'messenger' and select a page to subscribe your webhook to the page events

Now you can start chatting with your bot and develop new features.

## Setting persistent menu
```FB_PAGETOKEN=<Your_Page_Token_From_.Env> yarn set-menu```

## Faster deploy for development
`yarn sls deploy` can take a while.
For development you can use choose which function to deploy. For example:
`yarn sls deploy -f fbMessage`
