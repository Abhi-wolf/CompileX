import Consul from "consul";

export const consul = new Consul({
  host: "consul-client",
  port: 8500,
});


