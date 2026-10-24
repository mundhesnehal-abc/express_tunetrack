
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to read form data
app.use(express.urlencoded({ extended: false }));

// Serve CSS files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Temporary playlist storage
let songs = [];
let nextId = 1;

const allowedGenres = [
    "Pop",
    "Rock",
    "Hip-Hop",
    "Classical",
    "Jazz",
    "Electronic",
    "Other"
];

// GET route: Display home page
app.get("/", (req, res) => {
    const message = req.query.message || "";
    const type = req.query.type === "error" ? "error" : "success";

    const songList = songs.length
        ? songs.map(song => `
            <div class="song">
                <div class="music-icon">♫</div>
                <div class="details">
                    <strong>${escapeHTML(song.title)}</strong>
                    <p>${escapeHTML(song.artist)}</p>
                    <small>${escapeHTML(song.genre)} ·
                    ${song.duration} seconds</small>
                </div>
                <form action="/delete/${song.id}" method="POST">
                    <button class="delete" type="submit">
                        Remove
                    </button>
                </form>
            </div>
        `).join("")
        : "<p>No songs yet. Add your first song!</p>";

    res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport"
                content="width=device-width, initial-scale=1.0">
            <title>TuneTrack</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <main class="container">
                <header>
                    <h1>♫ TuneTrack</h1>
                    <p>Your music, your playlist.</p>
                </header>

                <section class="panel">
                    <h2>Add a Song</h2>

                    ${message ? `
                        <p class="${type}">
                            ${escapeHTML(message)}
                        </p>
                    ` : ""}

                    <form action="/songs" method="POST">
                        <label for="title">Song Title</label>
                        <input id="title" name="title"
                            maxlength="80" required>

                        <label for="artist">Artist Name</label>
                        <input id="artist" name="artist"
                            maxlength="60" required>

                        <label for="genre">Genre</label>
                        <select id="genre" name="genre" required>
                            <option value="">Choose genre</option>
                            ${allowedGenres.map(genre =>
                                `<option value="${genre}">${genre}</option>`
                            ).join("")}
                        </select>

                        <label for="duration">
                            Duration (seconds)
                        </label>
                        <input id="duration" name="duration"
                            type="number" min="1" max="3600" required>

                        <button class="add" type="submit">
                            + Add to Playlist
                        </button>
                    </form>
                </section>

                <section class="panel">
                    <h2>My Playlist (${songs.length})</h2>
                    ${songList}
                </section>
            </main>
        </body>
        </html>
    `);
});

// POST route: Validate and add a song
app.post("/songs", (req, res) => {
    const title = (req.body.title || "").trim();
    const artist = (req.body.artist || "").trim();
    const genre = (req.body.genre || "").trim();
    const durationText = (req.body.duration || "").trim();
    const duration = Number(durationText);

    const errors = [];

    // Server-side validation
    if (title.length < 1 || title.length > 80) {
        errors.push("Title must contain 1 to 80 characters.");
    }

    if (artist.length < 1 || artist.length > 60) {
        errors.push("Artist must contain 1 to 60 characters.");
    }

    if (!allowedGenres.includes(genre)) {
        errors.push("Please select a valid genre.");
    }

    if (
        durationText === "" ||
        !Number.isInteger(duration) ||
        duration < 1 ||
        duration > 3600
    ) {
        errors.push(
            "Duration must be a whole number from 1 to 3600."
        );
    }

    // Display errors if validation fails
    if (errors.length > 0) {
        return res.status(400).send(`
            <h2>Validation Failed</h2>
            <ul>
                ${errors.map(error =>
                    `<li>${escapeHTML(error)}</li>`
                ).join("")}
            </ul>
            <a href="/">Go Back</a>
        `);
    }

    // Save valid song in memory
    songs.push({
        id: nextId++,
        title,
        artist,
        genre,
        duration
    });

    res.redirect(
        "/?message=" +
        encodeURIComponent("Song added successfully!") +
        "&type=success"
    );
});

// POST route: Remove a song
app.post("/delete/:id", (req, res) => {
    const id = Number(req.params.id);

    const exists = songs.some(song => song.id === id);

    if (!Number.isInteger(id) || !exists) {
        return res.redirect(
            "/?message=" +
            encodeURIComponent("Song not found.") +
            "&type=error"
        );
    }

    songs = songs.filter(song => song.id !== id);

    res.redirect(
        "/?message=" +
        encodeURIComponent("Song removed successfully!") +
        "&type=success"
    );
});

// 404 route
app.use((req, res) => {
    res.status(404).send(`
        <h2>404 - Page Not Found</h2>
        <a href="/">Go to TuneTrack</a>
    `);
});

// Helper: Escape user input before displaying it in HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Start the Express server
app.listen(PORT, () => {
    console.log(`TuneTrack running at http://localhost:${PORT}`);
});
