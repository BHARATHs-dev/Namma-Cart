require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/database");

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`Namma Cart API listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start Namma Cart API:", error);
  process.exitCode = 1;
});
