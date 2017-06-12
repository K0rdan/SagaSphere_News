//////////
// Lib imports
import xml2js from "xml2js";
import Log from "sagasphere_logger";

const logTags = ["SagaSphere", "News", "XMLParser"];

function parse(xmlString) {
    const parser = new xml2js.Parser();

    return parser.parseString(xmlString, (err, result) => {
        if (err) {
            Log.error(logTags, `Error when parsing the XML : ${err}`);
        }
        else {
            // TODO add and use result parameter
            console.log(result);
        }
    });
}

export default {
    parse: xmlString => parse(xmlString)
};
