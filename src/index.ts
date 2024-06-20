import app from "./app"; // Contiene el servidor de express
import { sequelize } from "./config/config.mysql";
import { createServer } from "http";
import WebSocket, { Server } from "ws";
import { Request, Response } from "express";

// let asientosVendidos = 0;
let usuariosConectados = 0;
let sseClients: Response[] = [];
let userSseClients: Response[] = [];
let registeredUrls: String[] = [];

// Inicializar sillas
let sillas = [
  { id: 1, comprado: false },
  { id: 2, comprado: false },
  { id: 3, comprado: false },
  { id: 4, comprado: false },
  { id: 5, comprado: false },
  { id: 6, comprado: false },
  { id: 7, comprado: false },
  { id: 8, comprado: false },
  { id: 9, comprado: false },
  { id: 10, comprado: false },
  { id: 11, comprado: false },
  { id: 12, comprado: false },
];

// Creamos el servidor a partir de Express
const server = createServer(app);

// Creamos el servidor WebSocket y se asocia con el servidor HTTP
const wss = new Server({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("Nuevo Cliente");
  usuariosConectados += 1;
  enviarUserSSEClientes();

  // Se envia el estado de las sillas al nuevo cliente.
  ws.send(JSON.stringify({ type: "init", sillas }));

  ws.on("message", (message: string) => {
    const parsedMessage = JSON.parse(message);
    console.log("Received:", parsedMessage);

    if (parsedMessage.type === "comprar") {
      const { id } = parsedMessage;
      const silla = sillas.find((silla) => silla.id === id);
      if (silla && !silla.comprado) {
        silla.comprado = true;

        // Enviar actualización a todos los clientes conectados
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "update", sillas }));
          }
        });

        //Notificamos a las URls registradas por medio de WebHook
        notificarviaWebHook(id);
        // Enviar actualización a los clientes SSE
        enviarSSEClientes();
      }
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    usuariosConectados -= 1;
    enviarUserSSEClientes();
  });

  ws.on("error", (error) => {
    usuariosConectados -= 1;
    enviarUserSSEClientes();
    console.error("WebSocket error:", error);
  });
});

// --- SSE (Clientes en linea) ---
app.get("/api/clientOnline", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  userSseClients.push(res);

  req.on("close", () => {
    userSseClients = userSseClients.filter((client) => client !== res);
  });

  // Enviar la cantidad inicial de usuarios conectados al nuevo cliente
  res.write(`data: ${JSON.stringify({ usuariosConectados })}\n\n`);
});

function enviarUserSSEClientes() {
  userSseClients.forEach((client) => {
    client.write(`data: ${JSON.stringify({ usuariosConectados })}\n\n`);
    console.log({ data: usuariosConectados });
  });
}

// --- SSE (Sillas vendidas) ---
app.get("/api/sillasSSE", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  sseClients.push(res);

  req.on("close", () => {
    sseClients = sseClients.filter((client) => client !== res);
  });

  // Enviar la cantidad inicial de sillas vendidas al nuevo cliente
  const sillasVendidas = sillas.filter((silla) => silla.comprado).length;
  res.write(`data: ${JSON.stringify({ sillasVendidas })}\n\n`);
});

function enviarSSEClientes() {
  const sillasVendidas = sillas.filter((silla) => silla.comprado).length;
  sseClients.forEach((client) => {
    client.write(`data: ${JSON.stringify({ sillasVendidas })}\n\n`);
    console.log({ data: sillasVendidas });
  });
}

// ---- WebHooks ----

// Notifica a los Cli por medio de WebHooks
async function notificarviaWebHook(id: String) {

  const promises = registeredUrls.map(url => {
      const validUrl = String(url).trim();
      fetch(validUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              
          },
          body: JSON.stringify({
            notificacion: "Nueva silla comprada.",
            idsilla: id
          })
      })
      .then(response => {
          if (!response.ok) {
              throw new Error(`Error al reenviar la información a ${url}: ${response.statusText}`);
          }
          console.log(`Se notifica a la direccion [${url}]`);
      })
      .catch(error => {
          console.error(`Error al responder la información via Webhook a ${url}. \nError: ${error.message}`);
      })
  });
  await Promise.all(promises);
}

// Ruta para ver las URLs registradas
app.get('/register', (_: Request, res: Response) => {
    
  res.status(200).send({urls: registeredUrls});  
});

// Ruta para registrar una nueva URL
app.post('/register', (req: Request, res: Response) => {
  const { url } = req.body;

  if (url && !registeredUrls.includes(url)) {
      registeredUrls.push(url);
      res.status(200).send(`URL [${url}] registra.`);
  } else {
      res.status(400).send('URL invalida o ya esta registrada.');
  }
});

const PORT = 3000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Database connected");
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();
