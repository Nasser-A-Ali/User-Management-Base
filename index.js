const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { error } = require("console");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "verysecurekey123",
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
  {
    id: 1,
    username: "AdminUser",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for
    // our purposes we'll hash these existing users when the
    // app loads
    role: "admin",
  },
  {
    id: 2,
    username: "RegularUser",
    email: "user@example.com",
    password: bcrypt.hashSync("user123", SALT_ROUNDS),
    role: "user", // Regular user
  },
  {
    id: 3,
    username: "AnotherUser",
    email: "another@example.com",
    password: bcrypt.hashSync("another123", SALT_ROUNDS),
    role: "user", // Regular user
  },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
  const success = request.query.success
    ? "You have successfully signed up!"
    : null;
  response.render("login", { error: null, success }); // Check
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
  // Get the email and password from the request body
  const { email, password } = request.body;

  // Find the user by email
  const user = USERS.find((user) => user.email === email);
  if (!user) {
    return response.render("login", {
      error: "Invalid credentials, please try again.",
      success: null,
    });
  }

  // Check if the password matches
  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    return response.render("login", {
      error: "Invalid credentials, please try again.",
      success: null,
    });
  }

  // Store the user in the session
  request.session.user = user;

  // Redirect to the landing page
  response.redirect("/landing");
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
  response.render("signup", { error: null });
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
  // Get the username, email, and password from the request body
  const { username, email, password } = request.body;

  // Check if any of the fields are empty
  if (!username || !email || !password) {
    return response.render("signup", {
      error: "All fields are required, please try again.",
    });
  }

  // Check if the username or email already exists
  const existingUsername = USERS.find((user) => user.username === username);
  if (existingUsername) {
    return response.render("signup", {
      error: "Username already in use, please try again.",
    });
  }

  // Check if the email already exists
  const existingEmail = USERS.find((user) => user.email === email);
  if (existingEmail) {
    return response.render("signup", {
      error: "Email already in use, please try again.",
    });
  }

  // Get the next user ID
  function getNextUserId(users) {
    let nextId = 1;
    for (let i = 0; i < users.length; i++) {
      if (users[i].id >= nextId) {
        nextId = users[i].id + 1;
      }
    }
    return nextId;
  }

  const userId = getNextUserId(USERS);

  // Create a new user object
  const newUser = {
    id: userId,
    username: username,
    email: email,
    password: bcrypt.hashSync(password, SALT_ROUNDS),
    role: "user",
  };

  // Add the new user to the USERS array
  USERS.push(newUser);

  // Redirect to the login page with a success message
  response.redirect("/login?success=true");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
  if (request.session.user) {
    return response.redirect("/landing");
  }
  response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
  const user = request.session.user;

  if (!user) {
    return response.redirect("/"); // Check
  }

  if (user.role === "admin") {
    return response.render("landing", { user, users: USERS });
  }

  return response.render("landing", { user, users: null });
});

// GET /logout - Logs out the user
app.get("/logout", (request, response) => {
  request.session.destroy();
  response.redirect("/");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
