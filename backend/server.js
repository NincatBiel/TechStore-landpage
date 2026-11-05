const express = require('express');
const cors = require('cors');

const app = express();
const db = require('./db');

const PORT = 3000;

app.use(cors());
app.use(express.json());

// POST
app.post('/email', (req,res) => {
    const {email} = req.body
    db.query('INSERT INTO inscritos (email) VALUES (?)', [email], (err, results) => {
        if(err) return res.status(500).json({error: err.message});
        res.status(201).json({id: results.insertId, email});
    });
});



//LISTEN
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});