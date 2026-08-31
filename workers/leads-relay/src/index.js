export default {
  async fetch(request, env, ctx) {
    return new Response('not found', { status: 404 });
  },
};
