//////////
// Lib imports
import mysql from "mysql";
import fetch from "node-fetch";
// import schedule from 'node-schedule';
import Log from "sagasphere_logger";
//////////
// Custom imports
import XMLParser from "./xmlparser";

//////////
// Global variables
const logTags = ["SagaSphere", "News"];
// For local setup look at the README file.
const mysqlConnection = mysql.createConnection({
    host: process.env.SAGASPHERE_MYSQL_HOST || "localhost",
    localAddress: process.env.SAGASPHERE_MYSQL_LOCALADDRESS || "localhost",
    user: process.env.SAGASPHERE_MYSQL_USER || "root",
    password: process.env.SAGASPHERE_MYSQL_PASS || "cky_w+IQ@l",
    database: process.env.SAGASPHERE_MYSQL_DATABASE || "sagasphere"
});

//////////
// Function declaration
function initMySQL() {
    return new Promise((resolve, reject) => {
        if (process.env.DEBUG === "true") {
            Log.info(logTags, "Running 'initMySQL'...");
        }

        mysqlConnection.connect((err) => {
            if (err) {
                reject({ message: "Error with MySQL connection", error: err });
            }
            else {
                Log.info(logTags, `MySQL connection (${mysqlConnection.config.host} : ${mysqlConnection.config.port}) established.`);
                resolve();
            }
        });
    });
}

function getNewsURL() {
    return new Promise((resolve, reject) => {
        if (process.env.DEBUG === "true") {
            Log.info(logTags, "Running 'getNewsURL'...");
        }

        const query = "SELECT `sagas`.`id`, `sagas`.`title`, `sagas`.`newsUrl` FROM `sagas`";
        mysqlConnection.query(query, [], (err, rows) => {
            if (err) {
                reject({ message: "Error with MySQL.", error: err });
            }
            else if (!rows[0] || rows[0].length === 0) {
                resolve({ message: "No saga found." });
            }
            else {
                resolve({ rows });
            }
        });
    });
}

function getNews(res) {
    return new Promise((resolve, reject) => {
        if (process.env.DEBUG === "true") {
            Log.info(logTags, "Running 'getNews'...");
        }
        if (res && typeof (res) === "object" && res.length !== 0) {
            const fetches = [];
            for (let i = 0; i < res.rows.length; i++) {
                const saga = res.rows[i];
                fetches.push(fetch(saga.newsUrl)
                    .then(fetchesRes => fetchesRes.text())
                    .then(xmlData => ({ saga, xmlData }))
                    .catch(err => reject({ err: `Error on news fetch, ${err}` }))
                );
            }

            Promise.all(fetches)
                .then(fetchRes => resolve(fetchRes))
                .catch(err => reject({ err: `Error on news fetch, ${err}` }));
        }
    });
}

function postNews() {
    return new Promise((resolve) => {
        resolve();
    });
}

//////////
// Entry point
initMySQL()
    .then(getNewsURL)
    .then(getNews)
    .then(getNewsRes => new Promise((resolve, reject) => {
        const parses = [];
        for (let i = 0; i < getNewsRes.length; i++) {
            parses.push(XMLParser.parse(getNewsRes[i].saga, getNewsRes[i].xmlData)
                .then((parseRes) => {
                    Log.info(logTags, `${parseRes.newsParsed} news has successfully been parsed for the saga '${getNewsRes[i].saga.title}'.`);
                    return parseRes;
                })
            );
        }

        Promise.all(parses)
            .then((parsesRes) => {
                const totalNewsParsed = parsesRes.reduce((a, b) => a + parseInt(b.newsParsed, 10), 0);
                Log.info(logTags, `A total of ${totalNewsParsed} has been parsed.`);
            })
            .catch(err => reject({ err: `Error on news parse, ${err}` }));
    }))
    .then(postNews)
    .catch((err) => {
        Log.err(logTags, "Error when setting up the service.");
        Log.disableTimestamp();
        Log.err(err);
        Log.enableTimestamp();
    });
