const axios = require('axios');
const cheerio = require('cheerio');
const { MongoClient, ObjectId } = require('mongodb'); // MongoDB package
const download = require('download');


console.log("trs");
const uri = "mongodb+srv://OPCC:IvkXSDBCf1qUX8Hg@cluster.pauus.mongodb.net/OPCC?retryWrites=true&w=majority";
const dbName = "OPCC";


// FMWOVzH6guED21WB

(async () => {
  let client;
  try {
    
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('opcodes');

    const { data } = await axios.get('https://www.microsoft.com/en-us/microsoft-teams/download-app', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36'
      }
    });

    // Load the HTML into Cheerio
    const $ = cheerio.load(data);
    const downloadButton = $('#action-oc21be');
    const downloadLink = downloadButton.attr('href');



const destination = 'downloaded_file.exe';
const filePath = `${__dirname}/files`;

download(downloadLink,filePath)
.then(() => {
    console.log('Download Completed');
})

const { exec } = require('child_process');
const path = require('path');

// Path to your exe file
const exePath = path.join(__dirname, '/files/fwlink.exe');

// Call objdump to disassemble the exe file
exec(`objdump -d ${exePath}`,{ maxBuffer: 1024 * 5000 } ,(error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing objdump: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  // The disassembled output (opcodes) will be in stdout
  console.log('Disassembled opcodes:', stdout);
});




     const softwareDoc = {
      _id: new ObjectId(), // Create a new ObjectId for MongoDB
      Name: 'Microsoft Teams',
      Versions: [
        [
          { fileHash: 'test', versionNum: '11.1', opCodes: ["dsay"], url: downloadLink }
        ]
      ]
    };

    const result = await collection.insertOne(softwareDoc);
    console.log('Document inserted with _id:', result.insertedId);

    if (downloadLink) {
      console.log(`Download link: ${downloadLink}`);
    } else {
      console.log('Download button not found');
    }
  } catch (error) {
    console.error('Error fetching the page:', error);
  }
})();
