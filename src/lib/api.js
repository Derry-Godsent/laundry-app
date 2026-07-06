const API_URL = 'http://localhost:5000/api';

export const api = {
  // Clients
  getClients: () => fetch(`${API_URL}/clients`).then(res => res.json()),
  createClient: (data) => fetch(`${API_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  updateClient: (id, data) => fetch(`${API_URL}/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  
  // Services
  getServices: () => fetch(`${API_URL}/services`).then(res => res.json()),
  
  // Orders
  getOrders: () => fetch(`${API_URL}/orders`).then(res => res.json()),
  createOrder: (data) => fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
};