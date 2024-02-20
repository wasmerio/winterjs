const server = Bun.serve({
  port: 8080,
  fetch(request) {
    return new Response('hello');
  },
});
  
console.log(`Server running at ${server.url}`);
