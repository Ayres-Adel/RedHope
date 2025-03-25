  const express = require('express');
  const mongoose = require('mongoose');
  const authRoutes = require('./routes/authRoutes');
  const cookieParser = require('cookie-parser');
  const userRoutes = require('./routes/userRoutes');
  const dotenv = require('dotenv');
  const { requireAuth , checkUser } = require('./middleware/authMiddleware');
  const cors = require('cors');
  const app = express();

  dotenv.config();

  app.use(cors({
    origin:"*",
    credentials: true
  }));


  // middleware

  app.use(express.static('public'));
  app.use(express.json());
  app.use(cookieParser());


  // database connection

  mongoose.connect(process.env.MONGO_URI)
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err));

  // routes

  app.use(authRoutes);
  app.use('/api/user', userRoutes);