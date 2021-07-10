const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const app = express();
const nodemailer = require("nodemailer");
var serviceAccount = require("./firebaseConfig.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://intern-33579.firebaseio.com"
});

const db = admin.firestore();

app.use(cors());

function generateOTP() {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}
app.post("/otp", cors, async (req, res) => {
  let email = req.body.email;
  let otp = generateOTP();
  let docRef = (await db.collection("users").where("email", "==", email)).get();
  if ((await docRef).empty) {
    res.send({ status: "false" });
  } else {
    let doc = (await docRef).docs[0];
    await db.collection("users").doc(doc.id).update({ otp });
    mailer(email, otp);
    res.send({ status: "true" });
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const otp = req.body.otp;

  let docRef = (await db.collection("users").where("email", "==", email)).get();
  console.log((await docRef).size);

  if ((await docRef).empty) {
    return res.send({ status: "false" });
  } else {
    let doc = (await docRef).docs[0];
    let otpReal = doc.data()["otp"];
    console.log(doc.id);
    if (otpReal === otp) {
      res.send({ status: "true", token: doc.id });
    } else {
      return res.send({ status: "false" });
    }
  }
});

app.post("/signup", async (req, res) => {
  const email = req.body.email;
  const otp = "";
  let docRef = (await db.collection("users").where("email", "==", email)).get();
  if ((await docRef).empty) {
    await db.collection("users").add({
      email,
      otp
    });
    res.send({ status: "true" });
  } else {
    res.send({ status: "false" });
  }
});

app.get("/test", (req, res) => {
  res.send("ok");
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`App listening at http://localhost`);
});

function mailer(email, otp) {
  console.log("Mail Sending started");
  let transporter = nodemailer.createTransport({
    service: "homtail",
    host: "smtp-mail.outlook.com", // important
    auth: {
      user: "intern-33579@outlook.com",
      pass: "123456789qaz"
    }
    // debug: true,
    // logger: true
  });

  let mailOptions = {
    from: "intern-33579@outlook.com",
    to: email,
    subject: `OTP`,
    text: `OTP is ${otp}`
  };
  transporter.sendMail(mailOptions, function (err, data) {
    if (err) {
      console.log("Error:", err);
    } else {
      console.log("Email Sent");
    }
  });
}
