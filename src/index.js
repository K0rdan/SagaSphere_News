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
        const query = "SELECT `sagas`.`title`, `sagas`.`newsUrl` FROM `sagas`";
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
        if (res && typeof (res) === "object" && res.length !== 0) {
            for (let i = 0; i < res.rows.length; i++) {
                const saga = res.rows[i];
                fetch(saga.newsUrl)
                    .then(fetchRes => fetchRes.text())
                    .then(xmlData => XMLParser.parse(xmlData))
                    .catch((err) => {
                        Log.err(logTags, `Error on news fetch, ${err}`);
                        reject();
                    });
            }
        }
    });
}

//////////
// Entry point
initMySQL()
    .then(getNewsURL)
    .then(getNews)
    .catch((err) => {
        Log.err(logTags, "Error when setting up the service.");
        Log.err(err);
    });
