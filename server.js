const express = require('express');
const mysql = require('mysql');
const port = process.env.port || 3000;
const app = express();
const cryptoJS = require("crypto");
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');
const compression = require('compression')

app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression());

var connection = mysql.createConnection({
    host: 'sql9.freemysqlhosting.net',
    user: 'sql9381050',
    password: '63JDznsk55',
    database: 'sql9381050'
})

const secretKey = 'My super secret key';
const jwtMW = exjwt({
    secret: secretKey,
    algorithms: ['HS256']
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    var encrptd_password = cryptoJS.createHmac('sha256', password).update('nusrath').digest('hex');

    const login_query = `SELECT * FROM user_accounts WHERE username='${username}' AND password='${encrptd_password}'`;

    connection.query(login_query, function (error, results, fields) {
        if (error) {
            res.status(500);
        }
        else {
            if (results.length == 0) {
                res.status(401);
            }
            else {
                let token = jwt.sign({ id: results[0].id, username: results[0].username }, secretKey);
                res.status(200).json({
                    "token": token
                });
            }
        }
        res.json();
    });
})

app.post('/signup', (req, res) => {
    const { fullname, username, password } = req.body;

    var encrptd_password = cryptoJS.createHmac('sha256', password).update('nusrath').digest('hex');

    const signup_query = `INSERT INTO user_accounts(fullname, username, password) VALUES ('${fullname}', '${username}', '${encrptd_password}')`;

    connection.query(signup_query, function (error, results, fields) {
        if (error) {
            if (error.code == 'ER_DUP_ENTRY') {
                res.status(409);
            }
            else {
                res.status(500);
            }
        }
        else {
            let token = jwt.sign({ id: results.insertId, username: username }, secretKey);
            res.status(200).json({
                "token": token
            });
        }
        res.json();
    });
})


app.get('/get_budgets', jwtMW, (req, res) => {
    var configured_budget = [];

    const username = req.query.username;
    const budget_query = `SELECT * FROM configured_budget WHERE username='${username}'`;

    connection.query(budget_query, function (error, results, fields) {
        if (error) {
            res.status(500);
        }
        else {
            for (var i = 0; i < results.length; i++) {
                configured_budget.push({
                    "category": results[i].category,
                    "budget": results[i].budget,
                    "color": results[i].color
                })
            }
            res.status(200).json({
                "configured_budget": configured_budget
            });
        }
        res.json();
    });
});

app.get('/get_expenses', jwtMW, (req, res) => {
    var monthly_expenses = {};

    const username = req.query.username;
    const expense_query = `SELECT * FROM monthly_expenses WHERE username='${username}'`;

    connection.query(expense_query, function (error, results, fields) {
        if (error) {
            res.status(500);
        }
        else {
            for (var i = 0; i < results.length; i++) {
                month = results[i].month;
                expense_obj = {
                    "category": results[i].category,
                    "expense": results[i].expense,
                }
                if (month in monthly_expenses) {
                    monthly_expenses[month].push(expense_obj)
                }
                else {
                    monthly_expenses[month] = [expense_obj]
                }
            }
            res.status(200).json({
                "monthly_expenses": monthly_expenses
            });
        }
        res.json();
    });
});

app.post('/add_budget', (req, res) => {

    const { category, budget, color, username } = req.body;
    const add_budget_query = `INSERT INTO configured_budget(category, budget, color, username) VALUES ('${category}', '${budget}', '${color}', '${username}')`;

    connection.query(add_budget_query, function (error, results, fields) {
        if (error) {
            if (error.code == 'ER_DUP_ENTRY') {
                res.status(409);
            }
            else {
                res.status(500);
            }
        }
        else {
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            for (var i = 0; i < months.length; i++) {
                create_expenses_query = `INSERT INTO monthly_expenses(month, category, expense, username) VALUES ('${months[i]}', '${category}', '0', '${username}')`;
                connection.query(create_expenses_query, function (error, results, fields) {
                    if (error) {
                        res.status(500);
                    }
                    else {
                        res.status(200);
                    }
                });
            }
        }
        res.json();
    });
})

app.post('/update_budgets', (req, res) => {
    const { budget_array, username } = req.body;

    for (var i = 0; i < budget_array.length; i++) {
        update_budgets_query = `UPDATE configured_budget SET budget='${budget_array[i].budget}', color='${budget_array[i].color}' WHERE category='${budget_array[i].category}' AND username='${username}'`;
        connection.query(update_budgets_query, function (error, results, fields) {
            if (error) {
                res.status(500);
            }
            else {
                res.status(200);
            }
        });
    }
    res.json();
})

app.post('/add_expenses', (req, res) => {
    const { month, expense_array, username } = req.body;

    for (var i = 0; i < expense_array.length; i++) {
        add_expenses_query = `UPDATE monthly_expenses SET expense='${expense_array[i].expense}' WHERE category='${expense_array[i].category}' AND month='${month}' AND username='${username}'`;
        connection.query(add_expenses_query, function (error, results, fields) {
            if (error) {
                res.status(500);
            }
            else {
                res.status(200);
            }
        });
    }
    res.json();
})

app.listen(port, () => {
    console.log(`Server on port:${port}`);
});

module.exports = app