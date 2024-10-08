const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require('body-parser');
dotenv.config();
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { connectDB } = require("./config/db.js");
const contactRoutes = require("./routes/contactRoutes.js");
const propertyRouter = require("./routes/propertyRoutes.js");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const userRoutes = require("./routes/userRoutes");
const { errorHandler } = require("./middlewares/errorHandler.js");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true in production with HTTPS
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// *******Dont touch above **********

// add your routes here import here, also add here
app.use((req, res, next) => {
  next(); // Passes control to the next middleware or route handler
});
//eg.
//route import

//route declaration
//http://localhost:8000/api/v1/property/add-property
app.use("/api/v1/property", propertyRouter);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/user", userRoutes);

// error handler middleware
app.use(errorHandler);

// *******Dont touch below **********
connectDB()
  .then(() => {
    const port = process.env.PORT || 8000
    app.listen(port, () => {
      console.log(`✌ server is running on port : ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MONGODB Connection Failed !!", error);
  });
