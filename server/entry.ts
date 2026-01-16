import { createTodoHandler } from "./create-todo-handler";
import { apply, serve } from "@photonjs/express";
import express from "express";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export default startApp() as unknown;

function startApp() {
  const app = express();

  apply(app, [createTodoHandler]);

  return serve(app, {
    port,
  });
}
