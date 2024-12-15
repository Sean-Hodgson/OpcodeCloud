document.getElementById("searchForm").addEventListener("submit", async function (event) {
    event.preventDefault(); 

    const hash = document.getElementById("hashInput").value;
    const searchResult = document.getElementById("searchResult");

    try {
        const response = await fetch("http://localhost:3000/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ hash }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        searchResult.innerHTML = `
            <p><strong>Search Result:</strong></p>
            <pre>${JSON.stringify(responseData, null, 2)}</pre>
        `;
    } catch (error) {
        console.error("Error during search:", error);
        searchResult.innerHTML = `<p style="color: red;">An error occurred: ${error.message}</p>`;
    }
});
