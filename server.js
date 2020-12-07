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

app.post('/signup', (req, res) => {
    const { fullname, username, password } = req.body;
    fs.readFile('./myBudget.json', 'utf8', function readFileCallback(err, data) {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            signup_status = true;

            user_profile = {
                "fullname": fullname,
                "username": username,
                "password": password
            };

            obj = JSON.parse(data);
            user_accounts = obj.user_accounts;
            for (var i=0; i < user_accounts.length; i++) {
                if (user_accounts[i].username == username) {
                    signup_status = false;
                    break;
                }
            }

            if (signup_status) {
                obj.user_accounts.push(user_profile);

                json = JSON.stringify(obj);
                fs.writeFile('./myBudget.json', json, 'utf8', function (err, result) {
                    if (err) console.log('error', err);
                });    
            }

            res.json({
                "signup_status": signup_status
            });
        }
    });
})

app.get('/get_budgets', (req, res) => {
    fs.readFile('./myBudget.json', 'utf8', function readFileCallback(err, data) {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            obj = JSON.parse(data);
            res.json(obj);
        }
    });
});

app.post('/add_budget', (req, res) => {
    const { category, budget } = req.body;
    fs.readFile('./myBudget.json', 'utf8', function readFileCallback(err, data) {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            function getRandomColor() {
                var letters = '0123456789ABCDEF';
                var color = '#';
                for (var i = 0; i < 6; i++) {
                  color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
              }              
            obj = JSON.parse(data);
            obj.configured_budget.push(
                {
                    "category": category,
                    "budget": parseInt(budget),
                    "color": getRandomColor()
                });
            json = JSON.stringify(obj);
            fs.writeFile('./myBudget.json', json, 'utf8', function (err, result) {
                if (err) console.log('error', err);
            });
        }
    });
})

app.post('/update_budgets', (req, res) => {
    const { budget_array } = req.body;
    fs.readFile('./myBudget.json', 'utf8', function readFileCallback(err, data) {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            obj = JSON.parse(data);
            obj.configured_budget = budget_array;
            
            json = JSON.stringify(obj);
            fs.writeFile('./myBudget.json', json, 'utf8', function (err, result) {
                if (err) console.log('error', err);
            });
        }
    });

})


app.listen(port, () => {
    console.log(`API served at http://localhost:${port}`);
});