const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(express.static("public"));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
//setup mongoose

mongoose.connect(process.env.MONGO_URI);

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: { type: String, required: true },
    log: [
      {
        description: { type: String, required: true },
        duration: { type: Number, required: true },
        date: { type: Date, required: true },
      },
    ],
  },
  {
    versionKey: false, // You should be aware of the outcome after set to false
  },
);

const User = mongoose.model("User", userSchema);

//api endpoint to retrieve users
app.get("/api/users", (req, res) => {
  User.find()
    .then(function (docs) {
      res.send(docs);
    })
    .catch(function (err) {
      console.log(err);
    });
});

//post new user
app.post("/api/users", (req, res) => {
  const user = req.body.username;

  const new_user = new User({
    username: user,
  });

  new_user
    .save()
    .then(function (models) {
      console.log(models);
    })
    .catch(function (err) {
      console.log(err);
    });

  res.json(new_user);
});

//post new exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  const result_id = req.params["_id"];

  if (!req.body.date) {
    req.body.date = new Date();
  }

  User.findByIdAndUpdate(result_id, { $push: { log: req.body } })
    .then(function (models) {
      const date = new Date(req.body.date);
      const newDate = date.toDateString();

      const expected = {
        username: models.username,
        description: req.body.description,
        duration: Number(req.body.duration),
        date: newDate,
        _id: req.params["_id"],
      };

      res.json(expected);
    })
    .catch(function (err) {
      console.log("error", err);
      res.json({ CastError: err });
    });
});

//get logs
app.get("/api/users/:_id/logs", (req, res) => {
  const id = req.params["_id"];
  let limit = 500;
  const values = [];
  values.push(req.query);

  if (req.query.limit) {
    limit = Number(values[0].limit);
  }

  User.find({ _id: id }, { log: { $slice: limit } })

    .then(function (models) {
      const arr = models[0].log;
      const count = arr.length;
      const logEntries = [];

      for (let i = 0; i < count; i++) {
        if (arr[i].date) {
          const new_date = arr[i].date.toDateString();
          const object = {
            description: arr[i].description,
            duration: arr[i].duration,
            date: new_date,
          };
          logEntries.push(object);
        }
      }

      const newObject = { count: count, ...models[0].toObject(), log: logEntries };

      res.json(newObject);
    })

    .catch(function (err) {
      console.log("error", err);
      res.json({ Error: "Cannot find records" });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
