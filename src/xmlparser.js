//////////
// Lib imports
import xml2js from "xml2js";
import { JSDOM } from "jsdom";
import Log from "sagasphere_logger";

const logTags = ["SagaSphere", "News", "XMLParser"];

function rssFieldToString(sagaId, rssField) {
    let parsedRssField = typeof (rssField) !== "undefined" ? rssField : "";

    if (Array.isArray(parsedRssField) && parsedRssField.length > 0 && parsedRssField[0]) {
        parsedRssField = parsedRssField.join();
    }

    // TODO
    // Specific parsing
    switch (sagaId) {
        case 1: // Donjon de Naheulbeuk
            break;
        case 2: // Reflet d'Acide
            parsedRssField = parsedRssField.replace(/&#(\d+);/g, (match, HTMLentity) => String.fromCharCode(HTMLentity));
            break;
        default:
    }

    return parsedRssField;
}

function parseDesc(sagaId, desc) {
    if (process.env.DEBUG === "true") {
        Log.info(logTags, "Running 'parseDesc'...");
    }

    let parsedDesc = typeof (desc) !== "undefined" ? desc : "";
    let matchs = null;

    // Specific parsing
    switch (sagaId) {
        case 1: // Donjon de Naheulbeuk
            break;
        case 2: // Reflet d'Acide
            matchs = parsedDesc.match(/<p>(.*?)<\/p>/gi);
            if (Array.isArray(matchs) && matchs.length > 0 && matchs[0]) {
                parsedDesc = JSDOM.fragment(matchs[0]).textContent;
            }
            break;
        default:
    }

    return parsedDesc;
}

function parseNews(saga, news) {
    return new Promise((resolve, reject) => {
        if (process.env.DEBUG === "true") {
            Log.info(logTags, "Running 'parseNews'...");
        }

        const newsParsed = {};
        if (news.title && news.pubDate) {
            newsParsed.saga = saga.id;
            newsParsed.link = rssFieldToString(saga.id, news.link) !== "" ? rssFieldToString(saga.id, news.link) : saga.url;
            newsParsed.title = rssFieldToString(saga.id, news.title);
            newsParsed.date = rssFieldToString(saga.id, news.pubDate);
            newsParsed.description = parseDesc(saga.id, rssFieldToString(saga.id, news.description));

            resolve({ news: newsParsed });
        }
        else {
            reject({ err: `Can't save the news for the saga "${saga.title}", missing title or publication date` });
        }
    });
}

function parseFeed(saga, xmlString) {
    return new Promise((resolve, reject) => {
        if (process.env.DEBUG === "true") {
            Log.info(logTags, "Running 'parseFeed'...");
        }

        const parser = new xml2js.Parser();
        parser.parseString(xmlString, (xmlErr, result) => {
            if (xmlErr) {
                reject({ err: `Error when parsing the XML for "${saga.title}" : ${xmlErr}` });
            }
            else if (result.rss && result.rss.channel && result.rss.channel[0] && result.rss.channel[0].item) {
                const items = result.rss.channel[0].item;
                const promises = [];

                for (let i = 0; i < items.length; i++) {
                    promises.push(parseNews(saga, items[i]));
                }

                Promise.all(promises)
                    .then(resolve({ newsParsed: promises.length }))
                    .catch(parseErr => reject({ err: `Error when parsing one news from "${saga.title}", ${parseErr}` }));
            }
        });
    });
}

export default {
    parse: (saga, xmlString) => parseFeed(saga, xmlString)
};
