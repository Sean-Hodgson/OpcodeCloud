const express = require('express');
const cors = require('cors'); // Import the CORS middleware
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Enable CORS for all routes

app.use(cors({ origin: '*' }));

// Middleware to parse JSON requests
app.use(bodyParser.json({limit: '50mb'}));

// Directory for storing opcode files
const OPCODE_DIR = path.join(__dirname, 'opcodes');

// Ensure the opcode directory exists
if (!fs.existsSync(OPCODE_DIR)) {
    fs.mkdirSync(OPCODE_DIR);
}

// Helper to get the path for a hash file
const getOpcodeFilePath = (hash) => path.join(OPCODE_DIR, `${hash}.json`);

// Endpoint to compare opcodes
app.post('/compare', (req, res) => {
    const { hash, opcodeList } = req.body;

    // Validate the request body
    if (!hash || !opcodeList) {
        return res.status(400).json({ error: 'Missing hash or opcodeList in the request.' });
    }

    // Get the file path for the provided hash
    const filePath = getOpcodeFilePath(hash);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: `No stored opcodes found for hash: ${hash}` });
    }

    // Read and parse the stored opcodes
    const storedOpcodes = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Find differences between provided and stored opcodes
    const differences = opcodeList.filter(opcode => !storedOpcodes.includes(opcode));

    // Respond with differences
    if (differences.length > 0) {
        res.json({
            hash,
            Different: true,
            differences,
        });
    } else {
        res.json({
            hash,
            Different: false,
            differences: [], // Explicitly return an empty array for differences
        });
    }
});

// Endpoint to store new opcodes
app.post('/store', (req, res) => {
    const { hash, opcodeList } = req.body;

    if (!hash || !opcodeList) {
        return res.status(400).json({ error: 'Missing hash or opcodeList in the request.' });
    }

    const filePath = getOpcodeFilePath(hash);

    if (fs.existsSync(filePath)) {
        return res.status(400).json({ error: `Opcodes for hash ${hash} already exist.` });
    }
    

    fs.writeFileSync(filePath, JSON.stringify(opcodeList, null, 2));
    res.json({ message: 'Opcodes stored successfully.', hash });
});

// Endpoint to update existing opcodes
app.put('/update', (req, res) => {
    const { hash, opcodeList } = req.body;

    if (!hash || !opcodeList) {
        return res.status(400).json({ error: 'Missing hash or opcodeList in the request.' });
    }

    const filePath = getOpcodeFilePath(hash);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: `No stored opcodes found for hash: ${hash}` });
    }

    fs.writeFileSync(filePath, JSON.stringify(opcodeList, null, 2));
    res.json({ message: 'Opcodes updated successfully.', hash });
});

// Endpoint to fetch all stored opcodes
app.get('/opcodes', (req, res) => {
    const files = fs.readdirSync(OPCODE_DIR);
    const allOpcodes = files.reduce((acc, file) => {
        const hash = path.basename(file, '.json');
        const opcodes = JSON.parse(fs.readFileSync(path.join(OPCODE_DIR, file), 'utf-8'));
        acc[hash] = opcodes;
        return acc;
    }, {});

    res.json(allOpcodes);
});


app.post('/search', (req, res) => {
    const {hash} = req.body;

    // Validate the request body
    if (!hash) {
        return res.status(400).json({ error: 'Missing hash' });
    }

    // Get the file path for the provided hash
    const filePath = getOpcodeFilePath(hash);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: `No stored opcodes found for hash: ${hash}` });
    }

    // Read and parse the stored opcodes
    const storedOpcodes = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Find differences between provided and stored opcodes
    res.json({
        hash,
        storedOpcodes
    });
});



// Start the server
app.listen(port, () => {
    console.log(`Opcode API server running at http://localhost:${port}`);
});
