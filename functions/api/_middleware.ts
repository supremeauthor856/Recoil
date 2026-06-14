export const onRequest: PagesFunction = async (context) => {
  const response = await context.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
};
