"use strict";

/** Express app for Lobster Invoice. */

const express = require("express");
const cors = require("cors");
const { NotFoundError } = require("./expressError");
const { authenticateJWT } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const invoiceRoutes = require("./routes/invoices");
const clientRoutes = require("./routes/clients");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
//verifies a token if given
app.use(authenticateJWT);

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/clients", clientRoutes);

/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
