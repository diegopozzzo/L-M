import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, env.HOST, () => {
  console.log(
    `[api] ${env.APP_NAME} escuchando en http://${env.HOST}:${env.PORT}`,
  );
});
