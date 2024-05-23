import app from "./app"; //Contiene el servidor de express
import { sequelize } from "./config/config.mysql";
import { createServer } from "http";
import WebSocket, { Server } from "ws";

// let asientosVendidos = 0;
let usuariosConectados = 0;

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
  { id: 9, comprado: false }
];

// Creamos el servidor a partir de Express
const server = createServer(app);

// Creamos el servidor WebSocket y se asocia con el servidor HTTP
const wss = new Server({ server })

wss.on('connection', (ws: WebSocket) => {
  console.log('Nuevo Cliente');
  usuariosConectados += 1;
  // ws.send(`Usuario: ${usuariosConectados}`)

  // Se envia el estado de las sillas al nuevo cliente.
  ws.send(JSON.stringify({type: 'init', sillas}))

  ws.on('message', (message: string) => {
    const parsedMessage = JSON.parse(message);
    console.log('Received:', parsedMessage);
    
    if (parsedMessage.type === 'comprar') {
      const { id } = parsedMessage;
      const silla = sillas.find(silla => silla.id === id);
      if (silla && !silla.comprado) {
        silla.comprado = true;
        
        // Enviar actualización a todos los clientes conectados
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'update', sillas }));
          }
        });
      }
    }
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
