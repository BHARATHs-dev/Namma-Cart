require("dotenv").config();

const app = require("./app");
const { connectDatabase } = require("./config/database");

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  await connectDatabase();

    const server = app.listen(port, () => {
      console.log(`Namma Cart API listening on port ${port}`);
    });

    const shutdown = async () => {
      console.log("Shutting down Namma Cart API gracefully...");
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

startServer().catch((error) => {
    console.error("Failed to start Namma Cart API:", error);
    process.exitCode = 1;
  });
