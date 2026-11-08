const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.NESSIE_API_KEY;
const BASE_URL = 'http://reimaginebanking.com';

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Middleware to automatically append the Nessie API Key to requests
const nessieClient = axios.create({
    baseURL: BASE_URL,
    params: { key: API_KEY }
});

// ROUTE 1: Fetch details for a specific bank account
app.get('/api/accounts/:id', async (req, res) => {
    try {
        const response = await nessieClient.get(`/accounts/${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        res.status(status).json({ message: "Failed to fetch account.", error: error.message });
    }
});

// ROUTE 2: Fetch all transactions (deposits & withdrawals) for an account
app.get('/api/accounts/:id/transactions', async (req, res) => {
    try {
        const [deposits, withdrawals] = await Promise.all([
            nessieClient.get(`/accounts/${req.params.id}/deposits`),
            nessieClient.get(`/accounts/${req.params.id}/withdrawals`)
        ]);
        
        // Merge and sort transactions by date
        const history = [
            ...deposits.data.map(d => ({ ...d, type: 'Deposit', amount: d.amount })),
            ...withdrawals.data.map(w => ({ ...w, type: 'Withdrawal', amount: -w.amount }))
        ];
        
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Failed to gather transaction ledger." });
    }
});

// ROUTE 3: Post a new transaction (Deposit)
app.post('/api/accounts/:id/deposit', async (req, res) => {
    try {
        const payload = {
            medium: "balance",
            transaction_date: new Date().toISOString().split('T')[0],
            amount: parseFloat(req.body.amount),
            description: req.body.description || "Node.js Web App Deposit"
        };
        const response = await nessieClient.post(`/accounts/${req.params.id}/deposits`, payload);
        res.status(201).json(response.data);
    } catch (error) {
        res.status(400).json({ message: "Deposit processing failed." });
    }
});

app.listen(PORT, () => {
    console.log(`\n🏦 Local Banking App Server Active!`);
    console.log(`👉 Access your dashboard at: http://localhost:${PORT}\n`);
});
