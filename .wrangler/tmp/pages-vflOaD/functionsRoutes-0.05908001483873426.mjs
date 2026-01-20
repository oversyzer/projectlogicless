import { onRequest as __api_roblox_data_js_onRequest } from "C:\\github\\weblogicless\\functions\\api\\roblox-data.js"

export const routes = [
    {
      routePath: "/api/roblox-data",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_roblox_data_js_onRequest],
    },
  ]