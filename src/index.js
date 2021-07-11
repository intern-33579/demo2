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
app.get("/otp/:email", async (req, res) => {
  let email = req.params.email;
  let otp = generateOTP();
  let docRef = db.collection("users").where("email", "==", email).get();
  // console.log((await docRef).size());
  if ((await docRef).empty) {
    res.send({ status: "false" });
  } else {
    let doc = (await docRef).docs[0];
    await db.collection("users").doc(doc.id).update({ otp });
    mailer(email, otp);
    res.send({ status: "true" });
    // }
    // res.send("ok");
  }
});

app.get("/login/:email/:otp", async (req, res) => {
  const email = req.params.email;
  const otp = req.params.otp;

  let docRef = (await db.collection("users").where("email", "==", email)).get();
  console.log((await docRef).size);

  if ((await docRef).empty) {
    res.send({ status: "false" });
  } else {
    let doc = (await docRef).docs[0];
    let otpReal = doc.data()["otp"];
    console.log(doc.id);
    if (otpReal === otp) {
      res.send({ status: "true", token: doc.id });
    } else {
      res.send({ status: "false" });
    }
  }
});

app.get("/signup/:email", async (req, res) => {
  const email = req.params.email;
  const otp = generateOTP();
  let docRef = (await db.collection("users").where("email", "==", email)).get();
  if ((await docRef).empty) {
    await db.collection("users").add({
      email,
      otp
    });
    mailer(email, otp);
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

async function mailer(email, otp) {
  const cred = await (await db.collection("admin").doc("cred").get()).data();
  const senderMail = cred["email"];
  const senderPass = cred["pass"];
  console.log("Mail Sending started");
  let transporter = nodemailer.createTransport({
    service: "homtail",
    host: "smtp-mail.outlook.com", // important
    auth: {
      user: senderMail,
      pass: senderPass
    },
    debug: true,
    logger: true
  });

  let mailOptions = {
    from: `Admin <${senderMail}>`,
    to: email,
    subject: `OTP Authencation `,
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
