const request = require("supertest");
const app = require("./server");
const mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'sql9.freemysqlhosting.net',
  user: 'sql9381050',
  password: '63JDznsk55',
  database: 'sql9381050'
})

var data = {
    'username': 'test_user',
    'password': 'test_p$wd'
};

describe("POST / ", () => {
  test("Signup Test", async () => {
    // First, we delete the 'test_user' if it already exists so we can test signup functionality.
    const delete_test_user_query = `DELETE FROM user_accounts WHERE username='${data.username}'`;
    connection.query(delete_test_user_query);

    // Now, we try signing up the 'test_user' via API call.
    const response = await request(app).post("/signup").send(data);
    expect(response.statusCode).toBe(200);
    expect(response.body.token.length).toBeGreaterThan(0);
  });
});

describe("POST / ", () => {
  test("Login Test", async () => {
    // Here, we try logging in with the 'test_user' via API call.
    const response = await request(app).post("/login").send(data);
    expect(response.statusCode).toBe(200);
    expect(response.body.token.length).toBeGreaterThan(0);
  });
});

