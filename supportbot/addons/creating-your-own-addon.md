# Creating your own Addon

Creating your own SupportBot may sound easy but you'd need to the knowledge of the programming language \(NodeJS\) and the library \(DiscordJS\).

**Enough Rambling, On with the guide!**

1. Start by downloading the [example addon](https://emeraldservices.xyz/resources/resource/6-example-addon/?do=download) and extracting the files into the addons folder
2. Rename the example-addon.js file to the name of your choice
3. Rename the configuration file under settings to the name of your choice \(if required\)
4. Now open the file you named in **Step 2** file in a text editor of your choice
5. Change the configuration path in the file you opened in **Step 4**

```text
// We recommend changing the variable below named "example" to a name that relates to your addon
// Only change the name exampleaddon.yml to whatever you named the configuration file in Step 3

const example = yaml.load(fs.readFileSync('./addons/settings/exampleaddon.yml', 'utf8'));
```

Insert your functions inside the following code snippet:

```text
// Ensure to change the variables named "example" below to whatever you changed it to in Step 5

module.exports = {
    name: "insert addon name here",
    description: "insert addon name here",

    execute(message, args) {
        // Insert your functions here, the below line is not required and is just an example usage of variables
        message.channel.send(example.ExampleAddonMessage)
    }
};
```

If your addon requires static variables, We recommend creating them in the configuration file and referencing them inside your addon using.

```text
// The message.channel.send event below is used as an example
// Quote marks are not required when referencing a variable, only when a string is present

message.channel.send(example.VariableName)
```

### Publishing your Addon

Your addon is you're addon. We Emerald Services are not resposibile for anything to do your addons. So when you've finished developing and you're happy with your work you can share your addon on our official marketplace.  
  
[https://emeraldservices.xyz/resources/](https://emeraldservices.xyz/resources/)

