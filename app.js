/*
 * Module dependencies.
 */
const dotenv = require("dotenv");
const express = require("express");
const paypal = require("paypal-rest-sdk");

dotenv.config();
const app = express();
var amt = null;

const PORT = process.env.PORT;

/*
 * Paypal configuration.
 */
paypal.configure({
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});


app.get("/pay/:amt&:description", (req, res) => {
  amt = req.params.amt; // amount  value of transaction
  description = req.params.description; // description of transaction

  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    application_context: {
      shipping_preference: "NO_SHIPPING",
    },
    redirect_urls: {
      return_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    },
    transactions: [
      {
        amount: {
          currency: "EUR",
          total: amt,
        },
        description: description,
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

app.get("/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  console.log("payerId", payerId, "paymentId", paymentId);
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "EUR",
          total: amt,
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        res.send(error.response);
        throw error;
      } else {
        res.send({ message: "payment completed successfully" });
      }
    }
  );
});

app.get("/cancel", (req, res) => res.send("Cancelled"));

app.listen(PORT, () => console.log(`Server Started on ${PORT}`));
