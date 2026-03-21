/**
 * Обработка Callback от GitHub и обмен кода на токен
 */
export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).send(`GitHub Error: ${data.error_description || data.error}`);
    }

    // Возвращаем HTML-скрипт для передачи токена в CMS
    const content = `
      <!DOCTYPE html>
      <html>
      <head><title>Авторизация...</title></head>
      <body>
        <script>
          (function() {
            function receiveMessage(e) {
              // Сообщение для Sveltia / Decap CMS
              const token = "${data.access_token}";
              const result = JSON.stringify({
                token: token,
                provider: "github"
              });
              
              window.opener.postMessage(
                "authorization:github:success:" + result,
                e.origin
              );
            }
            window.addEventListener("message", receiveMessage, false);
            window.opener.postMessage("authorizing:github", "*");
          })();
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(content);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}
