


(async () => {
    try {
        // Get command-line arguments using NL_ARGS\
        console.log(NL_ARGS)
        if (NL_ARGS.length > 1) {
            const filePath = NL_ARGS[1]; // File path passed via context menu
            console.log(`Received file path from context menu: ${filePath}`);
            await processRLFile(filePath);
        } else {
            console.log("No file path provided.");
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
})();

async function processFile() {
    const fileInput = document.getElementById("fileInput");
    const output = document.getElementById("output");
    const alert = document.getElementById("alert");
    if (!fileInput.files.length) {
        output.innerText = "No file selected.";
        return;
    }

    const file = fileInput.files[0];

    output.innerText = "Processing file...";

    // Step 1: Compute the SHA-256 hash
    const arrayBuffer = await file.arrayBuffer();

    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    output.innerText = "Calculating hash...";

    // Step 2: Save the file temporarily for external analysis
    Neutralino.init();
    const tempFilePath = `./.tmp/${file.name}`;
    output.innerText = "Writing test file...";

    const chunkSize = 1024 * 1024; // 1 MB chunks
    let offset = 0;

    while (offset < arrayBuffer.byteLength) {
        const chunk = new Uint8Array(arrayBuffer.slice(offset, offset + chunkSize));
        await Neutralino.filesystem.appendBinaryFile(tempFilePath, chunk);
        offset += chunkSize;
    }
    console.log("File written successfully in chunks.");

    output.innerText = "Wrote file...";

    // Step 3: Run external tools to gather signing info and metadata
    const sigcheckOutput = await runCommand(`sigcheck64.exe -nobanner -c -vt ${tempFilePath}`);
    const metadataOutput = await runCommand(`file "${tempFilePath}"`);

    // Step 4: Extract opcode list using a disassembler (e.g., objdump or any similar tool)
    const opcodeOutput = await runCommand(`dumpbin.exe /DISASM ${tempFilePath}`);
    console.log("Opcode extraction complete.");
    output.innerText = "Opcode extraction complete....";
    const opcodeRegex = /^.{29}(.{1,12}).*$/gm;
    const opcodes = [];
    let match;
    while ((match = opcodeRegex.exec(opcodeOutput)) !== null) {
        opcodes.push(match[1]);
    }
   

    trimmedArray = opcodes.map(str => str.trim());
    console.log("Extracted opcodes:", trimmedArray.byteLength);
    output.innerText = "Uploading opcodes....";

    totalCharacters = 0
for (const string of trimmedArray) {
    totalCharacters += string.length;
  }
  
  console.log(totalCharacters);
    // Step 5: Send data to the API
    const payload = {
        hash: hashHex,
        // signingInfo: sigcheckOutput,
        // metadata: metadataOutput,
        opcodeList: trimmedArray
    };
    console.log(payload);
    output.innerText = `File Analysis Complete`;
    var dec;
    try {
        const response = await fetch("http://localhost:3000/compare", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        
        const responseData = await response.json();
        dec = !responseData.Different;

        if (responseData.Different == true)
        {
            alert.innerText = "This installer has been modified. DO NOT USE"
        }
    //JSON.stringify(responseData, null, 2)

    } catch (error) {
        output.innerText += `\n\nError: ${error.message}`;
    }


    try {
        const response = await fetch(`https://www.virustotal.com/api/v3/files/${hashHex}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-apikey": "2a4cdc44316b29d197cce226c99556fa89eeefe418af5d4d9c42cee790936f9f"
            }
        });
        
        const responseVTData = await response.json();
        console.log(responseVTData)
        output.innerText = `Exe: ${responseVTData.data.attributes.names[0]} \nHash: ${hashHex}\nOpcode Cloud Report:\n Matches database (is safe): ${dec} \n\n VirusTotal Report: \n${JSON.stringify(responseVTData.data.attributes.last_analysis_stats, null, " ")}`;
      
    //JSON.stringify(responseData, null, 2)

    } catch (error) {
        output.innerText += `\n\nError: ${error.message}`;
    }

    
   



}

// Helper: Run external commands using Neutralino CLI
async function runCommand(command) {
    try {
        console.log(command);
        const result = await Neutralino.os.execCommand(command);
        return result.stdOut || result.stdErr;
    } catch (err) {
        return `Error running command: ${err}`;
    }
}


async function processRLFile(filePath) {
    console.log(`Processing file: ${filePath}`);
    const tempDir = `./.tmp`;
    const tempFilePath = `${tempDir}/${filePath.split('\\').pop()}`;

    console.log(tempFilePath)

    try {
        // Step 1: Ensure the temp directory exists
        Neutralino.init();
        try {
            await Neutralino.filesystem.createDirectory(tempDir);
            console.log(`Temp directory created: ${tempDir}`);
        } catch (dirError) {
            if (dirError.code === 'EEXIST') {
                console.log(`Temp directory already exists: ${tempDir}`);
            } else {
                throw dirError;
            }
        }

        // Step 2: Copy the file to the temp directory
        await Neutralino.filesystem.copy(filePath, tempFilePath);
        console.log(`File copied to: ${tempFilePath}`);

        // Step 3: Calculate SHA-256 hash
        const fileContent = await Neutralino.filesystem.readBinaryFile(filePath);
        const hashBuffer = await crypto.subtle.digest('SHA-256', fileContent);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        console.log(`SHA-256 Hash: ${hashHex}`);

        // Step 4: Run external tools
        const opcodeOutput = await runCommand(NL_PATH +`/dumpbin.exe /DISASM ${tempFilePath}`);
        console.log(opcodeOutput);

     
    const opcodeRegex = /^.{29}(.{1,12}).*$/gm;
    const opcodes = [];
    let match;
    while ((match = opcodeRegex.exec(opcodeOutput)) !== null) {
        opcodes.push(match[1]);
    }
   

    trimmedArray = opcodes.map(str => str.trim());
    console.log("Extracted opcodes:", trimmedArray.byteLength);
        // Step 5: Save results
        const result = {
            file: filePath,
            hash: hashHex,
            opcodeList: opcodes,
            totalOpcodeCharacters: totalCharacters,
        };

        const resultPath = `${tempDir}/result.json`;
        await Neutralino.filesystem.writeFile(resultPath, JSON.stringify(result, null, 2));
        console.log(`Results saved to: ${resultPath}`);
    } catch (error) {
        console.error(`Error processing file: ${error.message}`);
    }
}