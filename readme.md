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

### Notes

- If you are using VS Code via Flatpak and `docker compose` is not visible, ensure Docker CLI is available in the Flatpak environment or use your host shell.
- Audio files are expected in `public/mp3/`.


```text
  _===_
  (o,o)
 /( : )\
  /   \
 /     \
```


