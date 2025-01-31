import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { IBibleBook, ICommand } from "./command-interfaces";
import { incrementStatAndUser, Log, NumberUtils } from "@helpers";
import { bookNames } from "@data";
import fetch from "node-fetch";

const log = new Log("Bibleverse");

const bibleAPI = "https://getbible.net/v2/elberfelder/";
const numberOfBooks = 66;

async function runCommand(int_book?: string, int_chapter?: number, int_verse?: number): Promise<EmbedBuilder> {
    // Check provided book
    let bookNumber: number;
    if (int_book) {
        if (isNaN(Number(int_book))) {
            // Check if int_book is a valid book name
            bookNumber = bookNames[int_book.toLowerCase()];
            if (!bookNumber) {
                return new EmbedBuilder().setTitle("Invalid book name!");
            }
        } else {
            // Check if the provided book number is valid
            if (Number(int_book) < 1 || Number(int_book) > numberOfBooks) {
                return new EmbedBuilder().setTitle("Invalid book number!");
            } else {
                bookNumber = Number(int_book);
            }
        }
    } else {
        // No book defined, get a random book number
        bookNumber = NumberUtils.getRandomInt(1, numberOfBooks);
    }
    // end of book check

    // Download provided book
    let book: IBibleBook;
    try {
        const response = await fetch(`${bibleAPI}${bookNumber}.json`);
        book = (await response.json()) as IBibleBook;
    } catch (error) {
        log.error(error);
        return new EmbedBuilder().setTitle("Error while downloading the bible!");
    }

    // Check provided chapter
    let chapterNumber: number;
    if (int_chapter) {
        if (book.chapters.length >= int_chapter && int_chapter > 0) {
            chapterNumber = Number(int_chapter);
        } else {
            return new EmbedBuilder().setTitle("Invalid chapter number!");
        }
    } else {
        // No chapter defined, get a random chapter number
        chapterNumber = NumberUtils.getRandomInt(1, book.chapters.length);
    }
    // end of chapter check

    // Check provided verse
    let verseNumber: number;
    if (int_verse) {
        if (book.chapters[chapterNumber - 1].verses.length >= int_verse && int_verse > 0) {
            verseNumber = int_verse;
        } else {
            return new EmbedBuilder().setTitle("Invalid verse number!");
        }
    } else {
        // No verse defined, get a random verse number
        verseNumber = NumberUtils.getRandomInt(1, book.chapters[chapterNumber - 1].verses.length);
    }
    // end of verse check

    let verseText = book.chapters[chapterNumber - 1].verses[verseNumber - 1].text;

    // Replace some words in the text with some random others
    verseText = verseText.replaceAll("König", "Paul");
    verseText = verseText.replaceAll("Gott", "Paul");
    verseText = verseText.replaceAll("Christus", "Felix");
    verseText = verseText.replaceAll("Mose", "Valentin");
    verseText = verseText.replaceAll("Priester", "Axel");
    verseText = verseText.replaceAll("Diener", "Kinder");
    verseText = verseText.replaceAll("Jehovas", "Angrys");
    verseText = verseText.replaceAll("Jesu Christi", "Wolfgang Rader");
    verseText = verseText.replaceAll("Engel", "Axel");
    verseText = verseText.replaceAll("Sünder", "Thomas");
    verseText = verseText.replaceAll("Gottseligkeit", "Angrylosigkeit (a.k.a. Freude)");

    return new EmbedBuilder()
        .setColor("Yellow")
        .setTitle("Bible Verse")
        .setDescription(verseText)
        .setFooter({
            text: `${book.name} ${chapterNumber}:${verseNumber}`,
        });
}

export const bibleverse: ICommand = {
    data: new SlashCommandBuilder()
        .setName("bibleverse")
        .setDescription("Get a random bible verse. Optionally via the arguments a specific verse can be requested.")
        .addStringOption(option =>
            option
                .setName("book")
                .setDescription("The name or number of the book within the bible (1-66).")
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName("chapter").setDescription("The number of the chapter.").setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName("verse").setDescription("The number of the verse.").setRequired(false)
        ),
    executeInteraction: async (interaction: CommandInteraction) => {
        const int_book = interaction.options.get("book")?.value as string | undefined;
        const int_chapter = interaction.options.get("chapter")?.value as number | undefined;
        const int_verse = interaction.options.get("verse")?.value as number | undefined;

        await interaction.reply({ embeds: [await runCommand(int_book, int_chapter, int_verse)] });
        await incrementStatAndUser("bibleverses-requested", interaction.user);
    },
    executeMessage: async (message: Message, args: string[]) => {
        const str_book = args[0]?.toLowerCase() as string | undefined;
        const str_chapter = args[1]?.toLowerCase() as string | undefined;
        const str_verse = args[2]?.toLowerCase() as string | undefined;
        let int_chapter: number | undefined;
        let int_verse: number | undefined;

        if (str_chapter) {
            int_chapter = parseInt(str_chapter);
        }
        if (str_verse) {
            int_verse = parseInt(str_verse);
        }

        await message.reply({ embeds: [await runCommand(str_book, int_chapter, int_verse)] });
        await incrementStatAndUser("bibleverses-requested", message.author);
    },
};
