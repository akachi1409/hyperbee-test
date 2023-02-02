const express = require("express");
const Hyperbee = require("hyperbee");
const Hypercore = require("hypercore");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const feed = new Hypercore("./Hyperbee-books");

feed.on("ready", async () => {
	console.log("feed is ready");

	const db = new Hyperbee(feed, {
		keyEncoding: "utf-8",
		valueEncoding: "binary",
	});

	await db.ready();
	console.log("Hyperbee database connected");

	app.get("/books", async (req, res) => {
		try {
			const books = [];
			for await (const book of db.createReadStream()) {
				console.log(book);
				books.push(book.key + ":" + book.value.toString());
			}
			res.send(books);
		} catch (err) {
			console.error(err)
			res.status(500).send({ error: "Failed to retrieve books" });
		}
	});

	app.get("/books/:id", async (req, res) => {
		try {
			const id = req.params.id;
			const book = await db.get(id);
			if (!book) {
				res.status(404).send({ error: "Book not found" });
			} else {
				res.send(book.value.toString());
			}
		} catch (err) {
			res.status(500).send({ error: "Failed to retrieve book" });
		}
	});

	app.post("/books", async (req, res) => {
		try {
			const book = req.body;
			console.log(book.newBook);
			const uid = uuidv4();
			const id = await db.put(uid, JSON.stringify(book.newBook));
			res.send({ uid });
		} catch (err) {
			console.error(err);
			res.status(500).send({ error: "Failed to create book" });
		}
	});

	app.put("/books/:id", async (req, res) => {
		try {
			const id = req.params.id;
			const book = req.body;
			await db.put(id, JSON.stringify(book.newBook));
			res.send({ success: true });
		} catch (err) {
			console.log("err", err);
			res.status(500).send({ error: "Failed to update book" });
		}
	});

	app.delete("/books/:id", async (req, res) => {
		try {
			const id = req.params.id;
			await db.del(id);
			res.send({ success: true });
		} catch (err) {
			res.status(500).send({ error: "Failed to delete book" });
		}
	});

	app.listen(5000, () => {
		console.log("Book CRUD service running on port 5000");
	});
});
