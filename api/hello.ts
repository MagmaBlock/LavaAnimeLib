export default eventHandler(async (event) => {
  console.log(event.headers);
  return "Hello Nitro";
});
