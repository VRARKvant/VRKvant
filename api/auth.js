/**
 * Входная точка авторизации GitHub для Sveltia CMS
 */
export default function handler(req, res) {
  const client_id = process.env.GITHUB_CLIENT_ID;
  const host = req.headers.host;
  
  // Протокол определяем по заголовку или хосту (Vercel использует https)
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirect_uri = `${protocol}://${host}/api/callback`;

  const githubUrl = new URL('https://github.com/login/oauth/authorize');
  githubUrl.searchParams.append('client_id', client_id);
  githubUrl.searchParams.append('redirect_uri', redirect_uri);
  githubUrl.searchParams.append('scope', 'repo,user');
  githubUrl.searchParams.append('state', Math.random().toString(36).substring(7));

  res.redirect(githubUrl.toString());
}
