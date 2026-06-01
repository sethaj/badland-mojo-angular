## Getting Started

This project is a Perl + Mojolicious + AngularJS app with SQLite, plus a Docker setup for running the app and backend tests.

### Software Requirements

- Git
- Docker Engine
- Docker Compose (v2 plugin recommended)
- Node.js 18+ and npm (for frontend tests)

Optional for running Perl directly on host (without Docker):

- Perl 5.36+
- cpanminus (`cpanm`)
- SQLite development headers/libs (platform package)

### Download and Install

```bash
git clone https://github.com/sethaj/badland-mojo-angular.git
cd badland-mojo-angular
```

Install frontend test dependencies:

```bash
npm install
```

Build Docker image(s):

```bash
docker compose build
```

### Run the App

Start the web app with Docker:

```bash
docker compose up app
```

Then open:

- http://localhost:8025

### Run Tests

Backend tests (Perl/Test::Mojo):

```bash
docker compose run --rm test prove -lv t/
```

Frontend tests (Karma/Jasmine):

```bash
npm test
```

### Optional: Run Without Docker

Install Perl dependencies from `cpanfile`:

```bash
cpanm --installdeps .
```

Run app directly:

```bash
perl badland.pl daemon -l http://0.0.0.0:8025
```

Run backend tests directly:

```bash
prove -lv t/
```

### Deploy to Production (badland.org)

Deployments run automatically via GitHub Actions on every push to `master`, after all tests pass. The workflow SSHes into the VPS, rsyncs the repo, and rebuilds/restarts the Docker container.

#### One-time setup

**1. Create a deploy SSH key** (on your local machine):

```bash
ssh-keygen -t ed25519 -C "github-deploy-badland" -f ~/.ssh/badland_deploy -N ""
```

**2. Add the public key to the VPS:**

```bash
cat ~/.ssh/badland_deploy.pub | ssh -p 22222 seth@104.131.114.145 "cat >> ~/.ssh/authorized_keys"
```

**3. Add these secrets to the GitHub repository** (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `DEPLOY_SSH_KEY` | Contents of `~/.ssh/badland_deploy` (private key) |
| `DEPLOY_HOST` | `104.131.114.145` |
| `DEPLOY_USER` | `seth` |

**4. Create the app directory on the VPS:**

```bash
ssh -p 22222 seth@104.131.114.145 "mkdir -p /home/seth/apps/badland"
```

**5. Create the systemd service on the VPS** at `/etc/systemd/system/badland.service`:

```ini
[Unit]
Description=Badland app (docker compose)
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=simple
User=seth
WorkingDirectory=/home/seth/apps/badland
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable badland
```

**6. Configure nginx** — create `/etc/nginx/sites-available/badland.org`:

```nginx
upstream badland {
  server 127.0.0.1:8025;
}

server {
  listen 80;
  server_name badland.org www.badland.org;

  location / {
    proxy_pass http://badland;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/badland.org /etc/nginx/sites-enabled/badland.org
sudo nginx -t && sudo systemctl reload nginx
```

**7. Update DNS** — In the Dreamhost panel, set the `A` record for `badland.org` and `www.badland.org` to `104.131.114.145`. Wait for propagation:

```bash
watch -n 30 "dig badland.org +short"
```

**8. Issue a Let's Encrypt certificate** (after DNS propagates):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d badland.org -d www.badland.org
```

Certbot will automatically update the nginx config to serve HTTPS on port 443 and redirect HTTP traffic. Certificates renew automatically via a systemd timer.

#### Triggering a deploy manually

Push to `master` and the Actions workflow will deploy automatically. To deploy from the VPS directly:

```bash
cd /home/seth/apps/badland
docker compose build && docker compose up -d --force-recreate app
```

### Notes

- If you are using VS Code via Flatpak and `docker compose` is not visible, ensure Docker CLI is available in the Flatpak environment or use your host shell.
- Audio files are expected in `public/mp3/` and are excluded from deploys (not overwritten by rsync).


```text
           \                  /
    _________))                ((__________
   /.-------./\\    \    /    //\.--------.\
  //#######//##\\   ))  ((   //##\\########\\
 //#######//###((  ((    ))  ))###\\########\\
((#######((#####\\  \\  //  //#####))########))
 \##' `###\######\\  \)(/  //######/####' `##/
  )'    ``#)'  `##\`->oo<-'/##'  `(#''     `(
          (       ``\`..'/''       )
                     \""(
                      `- )
                      / /
                     ( /\
                     /\| \
                    (  \
                        )
                       /
                      (
                      `
Mark Brooke-Sumner
```

```text
> One day I'd like to visit
> all the places I went crazy
> would you please come along with me?
>
> And when we get there
> I'll show you how
> sometimes I freak people out
>
> I'm still walking
> around the block
> people introduce themselves
> they wonder why I'm not
>
> walking with a bit of a stride
> saved for times
> when I'm leaving the world behind

```
