const express = require("express");
const app = express();
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { apiLimiter, authLimiter } = require('./api/middlewares/rate_limiter');
const errorHandler = require('./api/middlewares/error_handler');

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ limit: "200mb", extended: true }));

let isMaintenanceMode = false;
  
morgan.token("host", function (req) {
  return req.hostname;
});

let date = new Date().toJSON();
app.use(
  morgan((tokens, req, res) => {
    return [
      tokens.method(req, res),
      tokens.host(req, res),
      tokens.url(req, res),
      " | ",
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      tokens["response-time"](req, res),
      "ms",
      " - ",
      date,
    ].join(" ");
  })
);

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// API Routes
app.use("/api/auth", require("./api/routes/R_auth"));
app.use("/api/exercises", require("./api/routes/R_exercise"));
app.use("/api/workouts", require("./api/routes/R_workout"));
app.use("/api/assignments", require("./api/routes/R_workout_assignment"));

// CORS headers
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (isMaintenanceMode) {
    return res.status(503).json({
      message: "The server is under maintenance. Please try again later.",
    });
  }
  next();
});

// Error handling middleware
app.use(errorHandler);

const port = process.env.PORT || 4500;
const server = http.createServer(app);

// Database connection
require("./config/database");

// Static files
app.use("/public", express.static(path.join("./public")));
app.use("/css", express.static(path.join("./css")));

// Root route
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: path.join(__dirname, "templates") });
});

server.listen(port, () => {
  console.log(`Server listening at port : ${port}`);
});
  