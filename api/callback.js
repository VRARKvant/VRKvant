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
                Accept: 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).send(`GitHub Error: ${data.error_description || data.error}`);
        }

        // Разрешенные домены (Whitelist)
        const allowedOrigins = [
            'https://vrarkvant.github.io',
            'http://localhost:3000',
            'https://levdob.github.io' // На случай кастомного домена
        ];

        const content = `
      <!DOCTYPE html>
      <html>
      <head><title>Авторизация...</title></head>
      <body>
        <script>
          (function() {
            const allowedOrigins = ${JSON.stringify(allowedOrigins)};
            
            function receiveMessage(e) {
              if (!allowedOrigins.includes(e.origin)) {
                console.error("Origin not allowed: " + e.origin);
                return;
              }
              
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
            
            // Запрашиваем подтверждение от открывающего окна
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
