const Express = require("express");
const BodyParser = require("body-parser");
const fs = require("fs");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const CONNECTION_URL = 'mongodb+srv://Anmol:4yiD9Tok4jY84KD4@cluster0.yqk7d.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const DATABASE_NAME = "survey_responses";

var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
var database, collection;

const response_map = {
    '1': 'Strongly Disagree',
    '2': 'Disagree',
    '3': 'Slightly Disagree',
    '4': 'Netural',
    '5': 'Slightly Agree',
    '6': 'Agree',
    '7': 'Strongly Agree',
};

app.listen(5000, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if (error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("responses");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

app.post("/post_survey_responses", (request, response) => {
    collection.insert(request.body, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send(result.result);
    });
});

app.get("/get_survey_responses", (_, response) => {
    collection.find({}).toArray((error, result) => {
        if (error) {
            return response.status(500).send(error);
        }

        csv_json = []

        result.forEach(element => {
            csv_json_2 = []
            for (var i = 1; i < 37; i++) {
                if (`mfq_${i}` in element) {
                    csv_json_2.push({ question: i, response: response_map[element[`mfq_${i}`]] });
                } else {
                    csv_json_2.push({ question: i, response: 'Not Answered' });
                }
            }
            csv_json.push(csv_json_2)
        });

        var json = csv_json;
        var fields = json[0].map((_, index) => index + 1);
        var replacer = function (_, value) { return value === null ? '' : value }
        var csv = json.map(row => fields.map(fieldName => JSON.stringify(row[fieldName - 1].response, replacer)).join(','));
        csv.unshift(fields.join(','))
        csv = csv.join('\r\n');
        fs.writeFile('survey_responses.csv', csv, (err) => {
            if (err) throw err;
            console.log("write succcessful");
        });
        response.download(`${__dirname}/survey_responses.csv`);
    });
});