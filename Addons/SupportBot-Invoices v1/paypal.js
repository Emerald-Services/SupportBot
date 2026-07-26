const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType } = require('discord.js');
const fs = require('fs');
const yaml = require('js-yaml');
const paypal = require('paypal-rest-sdk');
const { Command } = require('../Structures/Addon.js'); // Adjust the path as needed

// Load the PayPal configuration
const config = yaml.load(fs.readFileSync("./Addons/Configs/paypal.yml", "utf8"));
const supportbot = config;

// Configure PayPal SDK
paypal.configure({
    mode: supportbot.PayPal.Mode, // sandbox or live
    client_id: supportbot.PayPal.ClientID,
    client_secret: supportbot.PayPal.ClientSecret
});

module.exports = new Command({
    name: "invoice",
    description: "Generate a PayPal invoice for a user.",
    options: [
        {
            name: "user",
            description: "The user to notify.",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "price",
            description: "The amount to invoice.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "service",
            description: "The service provided.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "email",
            description: "The email to invoice.",
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    permissions: ["Administrator"],

    async run(interaction) {
        const user = interaction.options.getUser("user");
        const price = interaction.options.getString("price");
        const service = interaction.options.getString("service");
        const email = interaction.options.getString("email");

        // Validate the price format
        if (isNaN(price) || parseFloat(price) <= 0) {
            const errorEmbed = new EmbedBuilder()
                .setDescription(`The price provided is invalid.`)
                .setColor(supportbot.Embed.Colours.Error)
                .setFooter({ text: supportbot.Embed.Footer });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const invoiceData = {
            "merchant_info": {
                "email": supportbot.PayPal.Email,
                "business_name": interaction.guild.name
            },
            "billing_info": [{
                "email": email
            }],
            "items": [{
                "name": service,
                "quantity": 1,
                "unit_price": {
                    "currency": "USD",
                    "value": price
                }
            }],
            "logo_url": supportbot.PayPal.Logo,
            "note": supportbot.PayPal.Note,
            "terms": supportbot.PayPal.TOS,
            "payment_term": {
                "term_type": "NET_45"
            },
            "tax_inclusive": false,
            "total_amount": {
                "currency": "USD",
                "value": price
            }
        };

        paypal.invoice.create(invoiceData, function (error, invoice) {
            if (error) {
                console.error(error);
                const errorEmbed = new EmbedBuilder()
                    .setTitle(`PayPal Error`)
                    .setDescription(`There was an error creating the invoice. Please check your configuration and try again.`)
                    .setColor(supportbot.Embed.Colours.Error)
                    .setFooter({ text: supportbot.Embed.Footer });
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            const invoiceId = invoice.id;
            paypal.invoice.send(invoiceId, function (error) {
                if (error) {
                    console.error(error);
                    const errorEmbed = new EmbedBuilder()
                        .setTitle(`PayPal Error`)
                        .setDescription(`There was an error sending the invoice. Please check your configuration and try again.`)
                        .setColor(supportbot.Embed.Colours.Error)
                        .setFooter({ text: supportbot.Embed.Footer });
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                const invoiceEmbed = new EmbedBuilder()
                    .setTitle(`Payment System | ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Service', value: service, inline: true },
                        { name: 'Amount Due', value: `$${price}`, inline: true },
                        { name: 'Currency', value: 'USD', inline: true },
                        { name: 'Invoice ID', value: `\`${invoiceId}\``, inline: false }
                    )
                    .setColor(supportbot.Embed.Colours.General)
                    .setFooter({ text: supportbot.Embed.Footer })
                    .setTimestamp();

                // Create a button with a link to the invoice
                const invoiceButton = new ButtonBuilder()
                    .setLabel('View Invoice')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://www.paypal.com/invoice/payerView/details/${invoiceId}`);

                // Create the action row
                const actionRow = new ActionRowBuilder()
                    .addComponents(invoiceButton);

                // Send the embed with the button
                interaction.reply({
                    embeds: [invoiceEmbed],
                    components: [actionRow]
                });
            });
        });
    },
});
