const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    fs.readFile('./myBudget.json', 'utf8', function readFileCallback(err, data) {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            login_status = false;
            obj = JSON.parse(data);
            user_accounts = obj.user_accounts;
            for (var i=0; i < user_accounts.length; i++) {
                if (user_accounts[i].username == username && user_accounts[i].password == password) {
                    login_status = true;
                    break;
                }
            }
            res.json({
                "login_status": login_status
            });
        }
    });
})


app.listen(port, () => {
    console.log(`API served at http://localhost:${port}`);
});