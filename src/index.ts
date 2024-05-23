import app from "./app";
import { sequelize } from "./config/config.mysql";
import { createServer } from "http";
import WebSocket, { Server } from "ws";

// let asientosVendidos = 0;
let usuariosConectados = 0;

// Creamos el servidor a partir de Express
const server = createServer(app);

// Creamos el servidor WebSocket y se asocia con el servidor HTTP
const wss = new Server({ server })

wss.on('connection', (ws: WebSocket) => {
  console.log('Nuevo Cliente');
  usuariosConectados += 1;
  ws.send(`Usuario: ${usuariosConectados}`)

  ws.on('message', (message: string) => {
    console.log('Received:', message);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    usuariosConectados -= 1;
  });
  
  ws.on('error', (error) => {
    usuariosConectados -= 1;
    console.error('WebSocket error:', error);
  });

});

app.get('/api/userOnline', (_req, res) => {
  res.json({ usuariosConectados });
});


const PORT = 3000;

(async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync();
      console.log('Database connected');
      server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
})();
