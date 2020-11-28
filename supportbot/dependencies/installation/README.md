# Installation

## Creating your Application

So assuming you've downloaded SupportBot and installed the required node modules we will move on to creating your application through discord and inviting it to your server.

{% hint style="info" %}
**Login to Discord Developers** [https://discordapp.com/developers/applications](%20https://discordapp.com/developers/applications)
{% endhint %}

Perfect! Now you're logged click on **"New Application"** and follow the steps shown on your screen. 

Created? Now open your application by clicking on it and select the **Bot** tab. Select **Add Bot** and you bot will appear on that page where you can change the icon and view its private information known as a the token.

{% hint style="danger" %}
**Never!** Share your bot's token with anyone. It's at your own risk.
{% endhint %}

## Inviting your Bot

So we've created the bot, Continuing on go to the **OAuth2** tab and check **Bot** then scroll down a little and check all the permissions you want your bot to have, We'd recommend **Administrator** as you're more likely to not run into any permission errors with the bot.

Ok so then scroll back up and you should be able to see an long url, Copy that and paste into a new tab and it should take you to your bot's invite page and just select your server.

## Setting up the Bot

Ok so now it is time we actually setup the bot assuming you have already downloaded SupportBot & installed the dependencies.

**Configuration -** The configuration file is stated supportbot-config.yml, This file is very important if you wan't to be able to customise your bot to you're liking and to of cause place your token. 

When you first open the file you'll see at the top it states the version of SupportBot, make sure that you are using 6.0 or newer as thats what this documentation supports. 

### Applying Bot Information

Ok so theres some important information we need to include in the configuration file before you can start customising it. If you remember from earlier when we made an application go back to that page and head to the bot tab and copy your bot's token and paste it where it says:  
  
**`Token: "BOT_TOKEN_HERE"`**

Another setting you'll need is to set a prefix for the bot, This is what you must enter before typing the name of the command for example `-help`.  
  
**`Prefix: "-"`**





