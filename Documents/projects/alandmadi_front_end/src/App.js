import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
import braintree from "braintree-web";

class App extends Component {
  getClientToken = async () => {
    const response = await axios.get("http://localhost:7000/token");
    return response.data;
  };

  async componentDidMount() {
    const token = await this.getClientToken();
    const form = document.querySelector("#my-sample-form");
    console.log("called component did mount");

    braintree.client.create(
      {
        authorization: token
      },
      function(clientErr, clientInstance) {
        console.log("got a response from client.create");
        if (clientErr) {
          console.error(clientErr);
          return;
        }

        // This example shows Hosted Fields, but you can also use this
        // client instance to create additional components here, such as
        // PayPal or Data Collector.

        braintree.hostedFields.create(
          {
            client: clientInstance,
            styles: {
              input: {
                "font-size": "14px"
              },
              "input.invalid": {
                color: "red"
              },
              "input.valid": {
                color: "green"
              }
            },
            fields: {
              number: {
                selector: "#card-number",
                placeholder: "4111 1111 1111 1111"
              },
              cvv: {
                selector: "#cvv",
                placeholder: "123"
              },
              expirationDate: {
                selector: "#expiration-date",
                placeholder: "10/2019"
              }
            }
          },
          function(hostedFieldsErr, hostedFieldsInstance) {
            console.log("got a response from hostedFields.create");
            if (hostedFieldsErr) {
              console.error(hostedFieldsErr);
              return;
            }

            // submit.removeAttribute('disabled');

            form.addEventListener("submit", function(event) {
              console.log("saw that you clicked submit");
              event.preventDefault();

              /**
               * The purpose of hostedFields.tokenize is to get a nonce from braintree
               * Get our first nonce, which we will use to create the customer using our
               * customerId endpoint
               */
              console.log("made it here");
              hostedFieldsInstance.tokenize(function(tokenizeErr, payload) {
                console.log("Made the req to get a nonce for customer id");
                if (tokenizeErr) {
                  console.error(tokenizeErr);
                  return;
                }
                // this call to our server creates the customer and returns the customer id
                axios
                  .post("http://localhost:7000/customerId", {
                    nonce: payload.nonce
                  })
                  .then(function(customerIdFromOurServer) {
                    console.log(
                      "customerIdFromOurServer:",
                      customerIdFromOurServer
                    );
                    /**
                     * Don't do anything with customer id on the frontend, just
                     * "relay" it back to the paymentMethod endpoint
                     */
                    // get another nonce, which we will use to create a payment method
                    // through our server's paymentMethod endpoint
                    hostedFieldsInstance.tokenize(function(
                      tokenizeErr,
                      payload
                    ) {
                      if (tokenizeErr) {
                        console.error(tokenizeErr);
                        return;
                      }

                      // create the payment method
                      axios
                        .post("http://localhost:7000/paymentMethod", {
                          nonce: payload.nonce,
                          customerId: customerIdFromOurServer.data
                        })
                        .then(function(responseFromOurServer) {
                          // this response doesn't contain anything substantial,
                          // just the fact that we succeeded
                          console.log(
                            "payment method res from our server:",
                            responseFromOurServer
                          );
                          hostedFieldsInstance.tokenize(function(
                            tokenizeErr,
                            payload
                          ) {
                            if (tokenizeErr) {
                              console.error(tokenizeErr);
                              return;
                            }
                            axios
                              .post("http://localhost:7000/transaction", {
                                nonce: payload.nonce
                              })
                              .then(function(
                                responseFromOurServerCreatingTransaction
                              ) {
                                console.log(
                                  responseFromOurServerCreatingTransaction
                                );
                              });
                          });
                        });
                    });
                  });
              }, false);
            });
          }
        );
      }
    );
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>

          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
        <form action="/" id="my-sample-form" method="post">
          <label htmlFor="card-number">Card Number</label>
          <div id="card-number" />

          <label htmlFor="cvv">CVV</label>
          <div id="cvv" />

          <label htmlFor="expiration-date">Expiration Date</label>
          <div id="expiration-date" />

          <input type="submit" value="Pay" />
        </form>
      </div>
    );
  }
}

export default App;
