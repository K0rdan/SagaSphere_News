//////////
// Lib imports
import mysql from "mysql";
import fetch from "node-fetch";
import CryptoJS, { SHA256 } from "crypto-js";
import schedule from "node-schedule";
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
    port: process.env.SAGASPHERE_MYSQL_PORT || 3306,
    localAddress: process.env.SAGASPHERE_MYSQL_LOCALADDRESS || "localhost",
    user: process.env.SAGASPHERE_MYSQL_USER || "root",
    password: process.env.SAGASPHERE_MYSQL_PASSWORD || "",
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

function fetchNews(res) {
    return new Promise((resolve, reject) => {
        if (process.env.DEBUG === "true") {
            Log.info(logTags, "Running 'fetchNews'...");
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

function parseNews(getNewsRes) {
    return new Promise((resolve, reject) => {
        if (process.env.DEBUG === "true") {
            Log.info(logTags, "Running 'parseNews'...");
        }
        const parses = [];
        for (let i = 0; i < getNewsRes.length; i++) {
            parses.push(XMLParser.parse(getNewsRes[i].saga, getNewsRes[i].xmlData)
                .then((parseRes) => {
                    Log.info(logTags, `${parseRes.length} news has successfully been parsed for the saga '${getNewsRes[i].saga.title}'.`);
                    return parseRes;
                })
            );
        }

        Promise.all(parses)
            .then((parsesRes) => {
                const totalNewsParsed = parsesRes.reduce((a, b) => a + parseInt(b.length, 10), 0);
                Log.info(logTags, `A total of ${totalNewsParsed} has been parsed.`);
                resolve(parsesRes.reduce((a, b) => a.concat(b), []));
            })
            .catch((err) => {
                Log.err(logTags, err);
                reject({ err: "Error on news parse" });
            });
    });
}

function postNews(parsedNews) {
    return new Promise((resolve, reject) => {
        if (process.env.DEBUG === "true") {
            Log.info(logTags, "Running 'postNews'...");
        }

        const queryBegin = "INSERT INTO `news` (`id`, `sagaID`, `date`, `url`, `title`, `content`, `hash`) VALUES ";
        const queryEnd = " ON DUPLICATE KEY UPDATE `hash`=`hash`;";
        const queryList = [];
        let query = "";
        let insertedRows = 0;

        for (let i = 0; i < parsedNews.length; i++) {
            const saga = mysql.escape(parsedNews[i].saga);
            const hash = mysql.escape(SHA256(JSON.stringify(parsedNews[i])).toString(CryptoJS.enc.Base64));
            const date = mysql.escape(new Date(parsedNews[i].date));
            const link = mysql.escape(parsedNews[i].link);
            const title = mysql.escape(parsedNews[i].title);
            const desc = mysql.escape(parsedNews[i].description);
            const newInsert = `(NULL, '${saga}', ${date}, ${link}, ${title}, ${desc}, ${hash})`;

            if (query.length === 0) {
                query += queryBegin;
            }
            else {
                query += ", ";
            }

            if ((query.length + newInsert.length + queryEnd.length) > 4000) {
                query = query.substring(0, query.length - 2); // remove last comma
                query += queryEnd;
                queryList.push(query);
                query = queryBegin + newInsert;
            }
            else {
                query += newInsert;
            }
        }

        query += queryEnd;
        queryList.push(query);

        queryList.forEach((q) => {
            mysqlConnection.query(q, [], (err, rows) => {
                if (err) {
                    reject({ message: "Error with MySQL.", error: err });
                }
                else {
                    insertedRows += rows.affectedRows;

                    if (process.env.DEBUG === "true") {
                        Log.info(logTags, `${rows.affectedRows} news saved.`);
                    }
                    if (insertedRows === parsedNews.length) {
                        resolve({ message: `A total of ${insertedRows} has been parsed.` });
                    }
                }
            });
        });
    });
}

function scheduleJob() {
    return new Promise((resolve) => {
        const job = schedule.scheduleJob("0 * * * *", () => {
            getNewsURL()
                .then(fetchNews)
                .then(parseNews)
                .then(postNews)
                .then((res) => {
                    if (res && res.message) {
                        Log.info(logTags, "Job success !");
                        Log.info(logTags, res.message);
                        Log.info(logTags, `Next job will be run the ${job.nextInvocation()}`);
                    }
                })
                .catch((err) => {
                    Log.err(logTags, "Error in a job");
                    Log.disableTimestamp();
                    Log.err(err);
                    Log.enableTimestamp();
                });
        });
        resolve(job);
    });
}

//////////
// Entry point
initMySQL()
    .then(scheduleJob)
    .then((job) => {
        Log.info(logTags, "Service successfully initialized !");
        Log.info(logTags, `The first job will be run the ${job.nextInvocation()}`);
    })
    .catch((err) => {
        Log.err(logTags, "Error when setting up the service.");
        Log.disableTimestamp();
        Log.err(err);
        Log.enableTimestamp();
    });
