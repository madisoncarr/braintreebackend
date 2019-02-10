let braintree = require("braintree");
let express = require("express");
const bodyParser = require("body-parser");

var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: "95c97fcqq655s84w",
  publicKey: "wdrrrzjgn6pfr2rs",
  privateKey: "0892deb9b7ef65197d38959b08a4a237"
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/testicles", function(request, response) {
  response.send("hello world");
});

app.get("/token", function(req, res) {
  gateway.clientToken.generate({}, function(err, response) {
    res.send(response.clientToken);
  });
});

app.post("/", function(request, response) {
  console.log(request.body);
  response.send("hello boobies!! *whistle noise*");
});

app.post("/customerId", function(request, response) {
  console.log("customer id endpoint hit!: ", request.body);

  gateway.customer.create(
    {
      firstName: "Charity",
      lastName: "Smith",
      paymentMethodNonce: request.body.nonce
    },
    function(err, createdCustomerResult) {
      createdCustomerResult.success;
      // true

      createdCustomerResult.customer.id;
      // e.g 160923

      createdCustomerResult.customer.paymentMethods[0].token;
      // e.g f28wm
      response.send(createdCustomerResult.customer.id);
    }
  );

  app.post("/paymentMethod", function(request, response) {
    gateway.paymentMethod.create(
      {
        customerId: request.body.customerId,
        paymentMethodNonce: request.body.nonce
      },
      function(err, result) {
        console.log(result);
      }
    );
  });

  app.post("/transaction", function(request, response) {});

  app.post("/nonce", function(request, response) {
    /**
     * 1. get the nonce from the frontend
     * 2. register the customer with braintree using gateway.customer.create
     *      - note that this will require the nonce
     * 3. get the response from (2) and access the customer id
     * 4. Create a payment method using gateway.paymentMethod.create
     *      - note that this will require the customer id from (3)
     * 5. Make a transaction
     *      - note that this will require the nonce
     *      - does this require anythng else from a previous step?????
     */
    if (!request.body.nonce) {
      response.send(
        "Hi! Your nonce was undefined so we didn't send a transaction."
      );
      return;
    }

    gateway.paymentMethod.create(
      {
        customerId: createdCustomerResult.customer.id,
        paymentMethodNonce: request.body.nonce
      },
      function(err, result) {
        console.log(result);
      }
    );
  });
  return;

  //https://developers.braintreepayments.com/reference/request/transaction/sale/node
  //https://developers.braintreepayments.com/guides/credit-cards/server-side/node#creating-transactions
  // gateway.transaction.sale(
  //   {
  //     amount: "10.00",
  //     paymentMethodNonce: request.body.nonce,
  //     options: {
  //       submitForSettlement: true
  //     }
  //   },
  //   function(err, result) {
  //     console.log(result);
  //     if (result.success) {
  //       // See result.transaction for details
  //       response.send("Transaction successful!");
  //     } else {
  //       // Handle errors
  //       response.send("Transaction unsuccessful :(");
  //     }
  //   }
  // );
});

app.listen(7000, () => console.log("Gator app listening to port 7000!"));

//Next step to send nonce to
