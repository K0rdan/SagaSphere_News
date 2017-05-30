(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

console.log("TODO");

/*let query = "SELECT `sagas`.`newsUrl` FROM `sagas` WHERE `sagas`.`id`=?";
mysql.query(query, [sagaID], (err, rows, field) => {
    // [KO] MySQL errors handler
    if (err) {
        reject({ code: 500, route: "GetNews", message: "Error with MySQL.", error: err });
    }
    // [OK] No MySQL errors
    else {
        // [KO] MySQL empty response.
        if(!rows[0] || rows[0].length == 0){
            resolve({ code: 200, route: "GetNews", message: "No saga found." });
        }
        // [OK] MySQL valid response
        else {
            fetch(rows[0].newsUrl, { timeout: Config.requests.timeout })
                .then((response) => {
                    if(response.ok){
                        return response.text();
                    }
                    else {
                        reject({ code: 500, route: "GetNews", message: "News fetch response error.", error: err });
                    }
                })
                .then((resText) => {
                    // TODO : Parse the XML response.
                    console.log(resText);                                const parser = new xml2js.Parser({ mergeAttrs: true });
                    parser.parseString(resText, function (err, rss) {
                        console.log(rss);
                        if(rss && rss.length != 0) {
                            resolve({ code: 200, route: "GetNews", message: "No news found." });
                        }
                        else {
                            rss.forEach(function(item) {
                                console.log(item);
                            }, this);
                            resolve({ code: 200, route: "GetNews", message: "Got " + 'X' + " news." });
                        }
                    });
                })
                .catch((err) => {
                    reject({ code: 500, route: "GetNews", message: "News fetch error.", error: err });
                });
        }
    }
});*/

})));
