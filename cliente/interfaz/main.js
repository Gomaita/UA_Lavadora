var electro = new Electro();

// Llena un deposito hasta un nivel usando un sensor de nivel y una valvula que abre el flujo
function llenar(sensor, valvula, nivel, callback) {
    console.log("  - Llenar depósito.", sensor, "->", nivel);
    electro.on(sensor, function comprobarNivel(nivelActual) { // monitorizar el sensor
        if (nivelActual >= nivel) { // se ha alzanzado el nivel
            electro.off(sensor, comprobarNivel); // dejar de monitorizar
            console.log("    - Cerrar válvula:", valvula);
            electro[valvula] = false; // cerrar la válvula
            callback();
        }
    });
    console.log("    - Abrir válvula:", valvula);
    electro[valvula] = true; // abro la topa
}

// Vaciar un deposito hasta un nivel usando un sensor de nivel y una válvula que abre el flujo
function vaciar(sensor, valvula, nivel, callback) {
    console.log("  - Vaciar depósito.", sensor, "->", nivel);
    electro.on(sensor, function comprobarNivel(nivelActual) { // monitorizar el sensor
        if (nivelActual <= nivel) { // se ha alzanzado el nivel
            electro.off(sensor, comprobarNivel); // dejar de monitorizar
            console.log("    - Cerrar válvula:", valvula);
            electro[valvula] = false; // cerrar la válvula
            callback();
        }
    });
    console.log("    - Abrir válvula:", valvula);
    electro[valvula] = true; // abro la topa
}

// Establece una temperatura a un valor, encendiendo y apagando una resistencia durante un tiempo (ms)
function termostato(sensor, resistencia, temp, duracion, callback) {
    function comprobarTemp(tempAct) {
        if (tempAct < temp) resistencia = true;
        if (tempAct > temp) resistencia = false;
    }
    electro.on(sensor, comprobarTemp);
    setTimeout(function () {
        electro[resistencia] = false;
        electro.off(sensor, comprobarTemp);
        callback();
    }, duracion);
}

// Realiza un lavado
function lavar(callback) {
    // Obtener parámetros del lavado
    var
        detergente = document.getElementById("detergente").value,
        suavizante = document.getElementById("suavizante").value,
        nivelAgua = document.getElementById("nivelAgua").value,
        temperaturaLavado = document.getElementById("temperaturaLavado").value,
        revolucionesLavado = document.getElementById("revolucionesLavado").value,
        tiempoLavado = document.getElementById("tiempoLavado").value * 1000,
        revolucionesCentrifugado = document.getElementById("revolucionesCentrifugado").value,
        tiempoCentrifugado = document.getElementById("tiempoCentrifugado").value * 1000;

    // Puerta abierta
    if (electro.puertaAbierta) {
        alert("Puerta abierta!!!!");
        callback();
        return;
    }

    // Hay ropa?
    if (!electro.peso) {
        alert("Parece que no hay ropa en la lavadora.");
        callback();
        return;
    }

    console.log("Iniciar lavado");
    electro.puertaBloqueada = true; // Bloquear puerta durante el lavado
    console.log("Puerta bloqueada");
    // Llenar de agua el tambor (para lavado)
    console.log("Llenar de agua (para lavado)...")
    llenar("nivelAgua", "tomaAgua", nivelAgua, function () {
        // Detergente
        console.log("Poner detergente...");
        vaciar("nivelDetergente", "tomaDetergente", electro.nivelDetergente - detergente, function () {
            // Lavado
            console.log("Lavar...")
            electro.tamborRevoluciones = revolucionesLavado;
            termostato("temperaturaAgua", "resistenciaAgua", temperaturaLavado, tiempoLavado, function () {
                // Vaciar agua
                console.log("Vaciar tambor de agua...");
                vaciar("nivelAgua", "desague", 0, function () {
                    // Llenar de agua para suavizante
                    console.log("Llenar de agua (para suavizante)...")
                    llenar("nivelAgua", "tomaAgua", nivelAgua, function () {
                        // Suavizante
                        console.log("Poner suavizante");
                        vaciar("nivelSuavizante", "tomaSuavizante", electro.nivelSuavizante - suavizante, function () {
                            // Vaciar agua
                            console.log("Vaciar tambor de agua...");
                            vaciar("nivelAgua", "desague", 0, function () {
                                // Centrifugar
                                console.log("Centrifugar...")
                                electro.tamborRevoluciones = revolucionesCentrifugado;
                                setTimeout(function () {
                                    console.log("Fin del lavado!!!");
                                    electro.tamborRevoluciones = 0; // parar motor
                                    electro.puertaBloqueada = false; // desbloquear puerta
                                    callback();
                                }, tiempoCentrifugado);
                            });
                        });
                    });
                });
            });
        });
    });
}

electro.on("connect", function () { // Esparar a que la librería se conecte con la lavadora
    console.log("Ya estoy conectado con la lavadora!!")
    console.log("Con este hay " + electro.clientes + " clientes conectados");

    // Bloqueo de puerta
    var bloqueo = document.getElementById("bloqueo");
    bloqueo.addEventListener("click", function () {
        electro.puertaBloqueada = !electro.puertaBloqueada;
    });
    electro.on("puertaBloqueada", function (bloqueado) {
        bloqueo.innerHTML = bloqueado ? "Desbloquear Puerta" : "Boquear Puerta";
    });

    // Lavar
    var botonLavar = document.getElementById("lavar");
    botonLavar.addEventListener("click", function () {
        botonLavar.disabled = true;
        lavar(function () {
            botonLavar.disabled = false;
        });
    });
});
