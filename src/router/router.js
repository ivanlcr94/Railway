import express from "express";
import passport from "passport";
import Authenticated from "../middlewares/middlewars.js";
import {fork} from 'child_process'
import os from 'os';
import compression from "compression";
import logger from '../../logger.js'


const cpuCount = os.cpus().length;
const puerto = process.argv[3]
//Array de productos en memoria
let productos = [];

const router = express.Router();

router.post("/login", passport.authenticate("login", {failureRedirect: "/faillogin"}), (req, res) => {
    logger.info('ingreso a la ruta /login metodo:post')
        res.redirect("/");
    }
);

router.post("/register", passport.authenticate("register", {failureRedirect: "/failregister"}),(req, res) => {
    logger.info('ingreso a la ruta /register metodo:post')    
    res.redirect("/");
    }
);


router.get("/failregister", (req, res) => {
    logger.info('ingreso a la ruta /failregister metodo:get') 
    res.render("register-error", {});
});

router.get("/faillogin", (req, res) => {
    logger.info('ingreso a la ruta /faillogin metodo:get') 
    res.render("login-error", {});
});

router.get("/register", (req, res) => {
    logger.info('ingreso a la ruta /register metodo:get') 
    res.render("register");
});

router.get("/logout", (req, res) => {
    logger.info('ingreso a la ruta /logout metodo:get') 
    const {username} = req.user;
    req.logout();
    res.render("logout", {
        username
    });
});

router.get("/login", Authenticated, compression(), (req, res) => {
    logger.info('ingreso a la ruta /login metodo:get') 
    res.render("login");
});
router.get("/", Authenticated, (req, res) => {
    logger.info('ingreso a la ruta /') 
    res.redirect("login");
});


//Un formulario de carga de productos en la ruta raíz (configurar la ruta '/productos' para recibir el POST, y redirigir al mismo formulario). //
router.post('/productos', (req, res) => {
    logger.info('ingreso a la ruta /productos metodo:post') 
    const { producto, precio, urlImagen } = req.body;
    //lanse un error cuando se carga un producto para generar el log en modo prod se guarda en warn.log level 50 = error
    if (!req.body){
        productos.push({ producto, precio, urlImagen });
    }else{
        logger.error('Se produjo un error al introducir datos')
    }
    
    res.render("home", { productos, username: req.user.username })

});

// SE AGREGO COMPRESSION AL GET /INFO

router.get("/info", compression(), (req, res) => {
    logger.info('ingreso a la ruta /info metodo:get') 
    const info = {
        argumentosDeEntrada: process.argv.slice(2),
        nombreDeSistemaOperativo: process.platform,
        vercionDeNode: process.version,
        memoriaTotalReservada: process.memoryUsage(),
        pathDeEjecucion: process.execPath,
        processID: process.pid,
        carpetaDeProyecto: process.cwd(),
        cantidadDeCpus: cpuCount
        }
    res.send(info);
});


router.get('/api/randoms', (req, res) => {
    logger.info('ingreso a la ruta /api/randoms metodo:get') 

    const forked = fork('src/factory/child.js')

    forked.on('message', msg => {
       if (msg == 'listo') {
           forked.send('Hola, ')
       } else {
           res.send(`el resultado de la suma es:  ${msg}  el puerto es: ${puerto}  PID ${process.pid} ` )
       }
    })
    
});

router.get('*', (req, res) => {
    logger.warn('esta ruta no existe')
    res.send('ruta no existe')
})


export default router;