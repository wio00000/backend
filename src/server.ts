import { createApp } from "./http/app";

const port = Number(process.env.PORT ?? 3000);

createApp().listen(port, () => {
  console.log(`Serverul ruleaza pe http://localhost:${port}`);
});
