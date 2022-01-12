
## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```


## Points:
  # Structure:
    - Application has been developed in 8 modules.
    1. Auth - It deals with the authentication.
    2. Admin - It deals with all the requests bound for Admin level access.
    3. Cards - It deals with all the cards and their operation.
    4. Config - It serves all the environment variable to the whole application.
    5. Filters - For now it has global error handling filter and all the requests pass through.
    6. Payments - Payments are done in this module. It keeps track of all the transactions and refunds.
    7. Users - It handles all the user data related operations.
    8. Utils - It keeps all the helper functions with no use of database.

  # Authentication:
    - User authentication has been skipped keeping the timeline in the mind.
    - User is only limited to mere functionality of basic CRUD by the admin himself.
    - Admin is created by the system, we don't have any signup functionlity as of now.
    - Refresh Tokens has been omitted from the development because of the time constraint
    - Login, Logout and change password apis have been implemented.
    - We are not creating forgot password api because it won't serve it whole purpose without adding a mailing service and will consume some extra time as well.
 
  # Payments:
    - 3-D secure customer authenntication has been skipped for      now 
    - We only have signle Credit-Card per user, that even is decided - 378282246310005,
      this is because in the test mode, both Braintree and Stripe have very limited range of cards as test cards, and that even get reduced by significant number when we want cards that will be valid for both the payment gateways. Now we have omitted 3-D auth, with that applied, we only got one card left which is acceptable in both the gatways. P.S.- On production level, this won't be an issue. 
    - We will be saving basic card info on the database, in encrypted format, all the sensitive information will be saved on the gateways. And all transactions will be done 
      entirely on the gateway side.
    - Basic error handling has been done, if had more time I could have made a more sophisticated gatway focused error-handler.
    - We are createing client payment token for the Stripe on the the backend as well which should have been on the client side, but for the minimal coplexity on the client side and to save some time I have done so.
    - We could have synced all the transactions with the gateway server to keep our database upto-date if had more time. But for now only the earliest one are being saved.

  ### Others: 
    - Tests for the application has not been written as there was not enough time left to do so.
    - Brain-tree payments take too much time to get setteled even in the test mode, because of that we gotta wait for the payment to be settled before anyone test refund functionality on the Braintree.
    - Backend is deployed on heroku and the url to access it is: https://stark-sea-18065.herokuapp.com/
    - In the Braintree payments amount between 1-1999 is for succcessful payment, rest amounts will give various other scenerios, so we should stay inside this range.
    - Adding any other test card may lead to to some unexpected behavior because it may not be listed as a valid card on both platforms. So please use only: 378282246310005 (With a 4 digit CVV)
