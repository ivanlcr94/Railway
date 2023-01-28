import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import handlebars from "express-handlebars";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import router from "./src/router/router.js";
import { User } from "./src/models/user.js";
import * as strategy from "./src/passport/strategy.js";
import minimist from "minimist";
import dotenv from "dotenv";
dotenv.config();
import logger from './logger.js'



// ----------------------Configurando minimist---------------------------//

const options = { 
  default:{ puerto: 8080, modo: false },
  alias:{ 
      p:'puerto', 
      m: 'modo' 
  } 
}
const process_arguments = minimist(process.argv.slice(2), options)

//----------------------------------------------------------------------------//

const PORT = process_arguments.puerto;

// modo cluster 

import cluster from 'node:cluster';
import os from 'os';
const cpuCount = os.cpus().length;





const app = express();
app.use(cookieParser());

// ----------------------Configurando connect-mongo---------------------------//
app.use(session({
    store:MongoStore.create({
      mongoUrl: process.env.MONGO_DB_URL, //paso las credenciales por .env (variable de entorno)
      ttl:600, // Session setiada en 10 minutos
      collectionName:'sessions'
  }),
  secret:'secret',
  resave: false,
  saveUninitialized: false,
  rolling: false,
  cookie: {
    maxAge: 600000,
  }
  }))
//----------------------------------------------------------------------------//


//------------------------------handlebars-----------------------------------//
app.engine("hbs",handlebars({extname: ".hbs",defaultLayout: "index.hbs",}));
app.set("view engine", "hbs");
app.set("views", "./src/views");
//----------------------------------------------------------------------------//

app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(router);


//--------------------------------passport-----------------------------------//

passport.use(
  "login",
  new LocalStrategy({ passReqToCallback: true }, strategy.login)
);

passport.use(
  "register",
  new LocalStrategy({ passReqToCallback: true }, strategy.register)
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

//----------------------------------------------------------------------------//

// si se pasa -m cluster como argumento el servidor inicia modo cluster, de lo contrario inicia normal.

if (process_arguments.modo == 'cluster') {

  if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);
    console.log('modo cluster')
  
    // Fork workers.
    for (let i = 0; i < cpuCount; i++) {
      cluster.fork();
    }
  
    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
    });
  } else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server
    
  const srv = app.listen(PORT, async () => {
    logger.info(`Servidor express escuchando en el puerto ${srv.address().port}`);
    try {
      await mongoose.connect(process.env.MONGO_DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      logger.info("Connected DB");
    } catch (error) {
      logger.info(`Error en conexión de Base de datos: ${error}`);
    }
  });
  srv.on("error", (error) => console.log(`Error en servidor ${error}`));
    
  
    console.log(`Worker ${process.pid} started`);
  }

} else {

  const srv = app.listen(PORT, async () => {
    logger.info(`Servidor express escuchando en el puerto ${srv.address().port}`);
    try {
      await mongoose.connect(process.env.MONGO_DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      logger.info("Connected DB");
    } catch (error) {
      logger.info(`Error en conexión de Base de datos: ${error}`);
    }
  });
  srv.on("error", (error) => logger.info(`Error en servidor ${error}`));

}


