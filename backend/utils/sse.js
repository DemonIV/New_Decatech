const clients = new Set();

const addClient = (res) => clients.add(res);
const removeClient = (res) => clients.delete(res);

const broadcast = (event, data = {}) => {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try { res.write(msg); } catch { clients.delete(res); }
  }
};

const clientCount = () => clients.size;

module.exports = { addClient, removeClient, broadcast, clientCount };
