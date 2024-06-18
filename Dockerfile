FROM perl:5.36-bullseye

ARG UNAME=app
ARG UID=1000
ARG GID=1000

RUN apt-get update -yqq && apt-get install -yqq --no-install-recommends \
  sqlite3 \
  libsqlite3-dev \
  vim-tiny

RUN groupadd -g ${GID} -o ${UNAME}
RUN useradd -m -d /app -u ${UID} -g ${GID} -o -s /bin/bash ${UNAME}

WORKDIR /app

RUN cpan App::cpanminus
COPY cpanfile .
RUN cpanm --notest --installdeps .

COPY --chown=$UID:$GID . .

