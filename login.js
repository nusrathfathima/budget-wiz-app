
function login(user) {
    var username = user.username.value;
    var password = user.password.value;
    let axiosConfig = {
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            "Access-Control-Allow-Origin": "*",
        }
    };
    var data = {
        'username': username,
        'password': password
    };

    axios.post('http://142.93.1.183:3000/login', data)
        .then(function (res) {

            // document.getElementById("login_message").innerHTML = "<div class=\"alert alert-success\"><strong>Success!</strong> Login Successful.</div>"

            document.getElementById("username").value = "";
            document.getElementById("password").value = "";

            window.history.replaceState("", 'Dashboard', './dashboard.html');
            document.getElementById("display_username").innerHTML = username;
            localStorage.setItem('jwt', res.data.token);
            document.title = 'Dashboard';

            $(".homeContent").hide();
            $(".dashboardContent").show();
            $('.userDropdown').show();
            $(".homeMenuBanner").hide();
            $(".dashboardMenuBanner").show();

            $(".pieChart").load("pie.html");
            $(".barChart").load("bar.html");
            $(".lineChart").load("line.html");
            $(".monthlyExpense").load("monthly_expense.html");
            $(".configureBudget").load("configure_budget.html");

            $("#graphsTab").click();

            var jwtTimeout = setTimeout(() => {
                jwtExpires();
            }, 60000
            )

            setTimeout(() => {
                sessionExpiration(jwtTimeout);
            }, 40000
            )

        }).catch((err) => {
            try {
                status_code = err.response.status;
            }
            catch (e) {
                status_code = 500;
            }

            if (status_code == 401) {
                alert("Incorrect Username or Password!!!");
            }
            else if (status_code == 500) {
                alert("Internal Server Error. Please Try Again!");
            }

        })
};

module.exports = login
