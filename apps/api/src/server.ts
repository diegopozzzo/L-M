import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  console.log(
    `[api] ${env.APP_NAME} escuchando en http://localhost:${env.PORT}`,
  );
});
